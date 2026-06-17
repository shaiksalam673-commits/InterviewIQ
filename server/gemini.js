import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// Check if API key is configured
const isMockMode = !apiKey || apiKey.trim() === '';

if (isMockMode) {
  console.warn('⚠️  GEMINI_API_KEY is not configured. InterviewIQ will run in demo/mock mode.');
}

const genAI = isMockMode ? null : new GoogleGenerativeAI(apiKey);

/**
 * Helper to retry failed Gemini calls up to 2 times with a 1s delay.
 */
async function withRetry(fn, retries = 2, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`Gemini call failed, retrying in ${delay}ms... (Retries remaining: ${retries})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay);
  }
}

/**
 * Parses resume text and JD text into candidate profile.
 */
export async function analyzeProfile(resumeText, jdText, targetRole = 'Full Stack') {
  if (!resumeText || resumeText.trim().length < 100) {
    throw new Error("Resume text too short. Please upload a text-based PDF.");
  }

  if (isMockMode) {
    return getMockProfile(resumeText, jdText, targetRole);
  }

  const prompt = `You are a professional recruiting coordinator. Analyze the following candidate's Resume text, the Job Description (JD) text, and their Target Job Role preset.
Evaluate their qualifications specifically against this target role.

Target Role Preset:
${targetRole}

Resume Text:
${resumeText}

Job Description Text:
${jdText}

You must return a JSON response. The JSON object must have exactly these keys:
{
  "name": "String (Name of the candidate, default to 'Candidate' if not found)",
  "experienceYears": Number (Total years of experience found or estimated, default 0),
  "experienceLevel": "String (Must be one of: 'Fresher', 'Junior', 'Mid', 'Senior')",
  "experienceExplanation": "String (Short summary explaining how you determined this experience level)",
  "technicalSkills": ["Array of Strings (Technical/hard skills found in the resume)"],
  "softSkills": ["Array of Strings (Soft/communication skills found in the resume)"],
  "jdSkills": ["Array of Strings (Core skills required in the job description)"],
  "matchedSkills": ["Array of Strings (Skills in both resume and job description)"],
  "missingSkills": ["Array of Strings (Core skills in job description but not in resume)"],
  "matchPercentage": Number (Overall match score between 0 and 100 based on overlap and experience requirements),
  "warmupGreeting": "String (A short, professional greeting message from the interviewer, e.g., 'Welcome Alex. I have reviewed your profile and the Job Description for the ${targetRole} position...')",
  "targetRole": "String (The target role preset passed in: '${targetRole}')"
}

Ensure the output is valid JSON.`;

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: "You are a professional HR and technical parser. You output ONLY valid JSON.",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await withRetry(() => model.generateContent(prompt));
    const text = result.response.text().trim();
    const resultJson = JSON.parse(text);
    resultJson.targetRole = resultJson.targetRole || targetRole;
    return resultJson;
  } catch (error) {
    console.error('Error analyzing profile with Gemini, falling back to mock parser:', error);
    return getMockProfile(resumeText, jdText, targetRole);
  }
}

/**
 * Generates the next question based on profile, history, and current index.
 */
export async function generateQuestion(profile, history, questionNumber) {
  if (isMockMode) {
    return getMockQuestion(profile, history, questionNumber);
  }

  // Map questionNumber to category
  let category = '';
  let categoryInstruction = '';
  if (questionNumber <= 2) {
    category = 'Warm-up';
    categoryInstruction = 'Ask a warm-up question. The first should focus on an introduction/background, the second on motivation for the role and career alignment.';
  } else if (questionNumber <= 7) {
    category = 'Technical';
    categoryInstruction = `Ask a technical skill-based question. Target one of the matched skills (${profile.matchedSkills.join(', ')}) or key required skills (${profile.jdSkills.join(', ')}). 
    Tailor the difficulty strictly to the detected experience level: ${profile.experienceLevel}.
    Difficulty Guidelines:
    - Fresher (0-1 yr): concept-based, theoretical foundations.
    - Junior (1-3 yrs): practical usage, real-world examples, coding concepts.
    - Mid (3-6 yrs): problem-solving, architectural basics, database design, API design.
    - Senior (6+ yrs): system design, scalability trade-offs, security, leadership scenarios.`;
  } else if (questionNumber <= 9) {
    category = 'Behavioral';
    categoryInstruction = 'Ask a behavioral question testing soft skills, leadership, conflict resolution, or teamwork. Force the candidate to describe a scenario using the STAR format (Situation, Task, Action, Result).';
  } else {
    category = 'Situational';
    categoryInstruction = 'Ask a situational scenario question. Describe a challenging hypothetical workplace problem (e.g. system outage, conflict in priority, security breach) and ask how they would react and handle the trade-offs.';
  }

  const recentHistory = history.slice(-2);
  const coveredTopics = history.map((h, i) => `- Q${i + 1}: ${h.question}`).join('\n');
  const previousFirstWords = history.map(h => h.question.trim().split(/\s+/)[0].toLowerCase());
  const lastFirstWord = previousFirstWords.length > 0 ? previousFirstWords[previousFirstWords.length - 1] : '';
  const previousTopicSnippets = history.map(h => h.question.split(' ').slice(0, 5).join(' ')).join(' | ');

  const prompt = `You are a professional, polite, and encouraging but strict technical interviewer conducting a mock interview for:
Candidate: ${profile.name}
Target Role: ${profile.targetRole || 'Full Stack Developer'}
Role Level: ${profile.experienceLevel} (${profile.experienceYears} years of experience)
Target Match: ${profile.matchPercentage}% match

Candidate Profile Details:
- Matched Skills: ${profile.matchedSkills.join(', ')}
- Missing Skills: ${profile.missingSkills.join(', ')}
- Technical Skills: ${profile.technicalSkills.join(', ')}
- Soft Skills: ${profile.softSkills.join(', ')}

This is Question ${questionNumber} of 10.
Total answered: ${history.length}/10
Category: ${category}
Instruction: ${categoryInstruction}

Previous Interview History (showing last 2 exchanges):
${recentHistory.map((h, i) => {
  const idx = history.length - recentHistory.length + i + 1;
  return `Q${idx}: ${h.question}\nA${idx}: ${h.answer}\nEvaluation: ${h.evaluation?.feedback || 'N/A'}`;
}).join('\n\n')}

CRITICAL CONSTRAINTS:
1. Ask exactly ONE question. Do not include introductory conversation, banter, or multiple questions in one turn.
2. DO NOT reveal the answers to the question.
3. Keep the tone professional, businesslike, yet engaging.
4. Adapt the language and depth to the experience level: ${profile.experienceLevel}.
5. If the question contains code blocks, wrap them in standard markdown triple backticks.
6. Do not ask about topics already covered in previous questions:
${coveredTopics || 'None'}

ADDITIONAL RULES:
- Never ask a question already covered in history. Previously asked topics: ${previousTopicSnippets || 'None'}
- For technical questions, always end with: 'Please explain with a real example from your experience or a practical scenario.'
- For Senior level, always include a follow-up constraint like: 'How would this scale to 10 million users?' or 'What are the security implications?'
- Never start this question with the word "${lastFirstWord}" — the previous question already started with that word.

Generate only the question text.`;

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: "You are a professional interviewer. You ask single, focused questions matching the interview phase and experience level. You do not explain your reasoning, you only output the question.",
    });

    const result = await withRetry(() => model.generateContent(prompt));
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating question with Gemini, falling back to mock:', error);
    return getMockQuestion(profile, history, questionNumber);
  }
}

/**
 * Evaluates the candidate's answer to a question.
 */
export async function evaluateAnswer(question, answer, profile) {
  if (isMockMode) {
    return getMockAnswerEvaluation(question, answer, profile);
  }

  const prompt = `You are a strict yet professional interviewer. Evaluate the candidate's answer to the question asked.

Question:
${question}

Candidate's Answer:
${answer}

Candidate Profile context:
- Level: ${profile.experienceLevel}
- Name: ${profile.name}

Evaluate strictly based on these criteria:
- Correctness (30 points): Is the answer technically accurate?
- Depth (25 points): Does it go beyond surface level explanation?
- Real-world application (25 points): Did they give a concrete example or scenario?
- Communication (20 points): Is it structured, clear and concise?

The total score is the sum of all four criteria scores (max 100).

You must return a JSON response. The JSON object must have exactly these keys:
{
  "score": Number (Sum of all criteria scores, 0-100),
  "feedback": "String (Constructive feedback explaining the score and what was missing or correct)",
  "strengths": ["Array of Strings (1-2 specific strengths demonstrated in the response)"],
  "improvements": ["Array of Strings (1-2 specific suggestions for improving this answer)"],
  "idealAnswerHints": ["3 bullet points showing what a perfect answer would include"],
  "criteriaScores": {
    "correctness": Number (0-30),
    "depth": Number (0-25),
    "realWorld": Number (0-25),
    "communication": Number (0-20)
  }
}

Ensure the output is valid JSON.`;

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: "You are an objective technical evaluator. You output ONLY valid JSON.",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await withRetry(() => model.generateContent(prompt));
    const text = result.response.text().trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error evaluating answer with Gemini, falling back to mock:', error);
    return getMockAnswerEvaluation(question, answer, profile);
  }
}

/**
 * Generates the final performance report.
 */
export async function generateFinalReport(profile, history) {
  if (isMockMode) {
    return getMockReport(profile, history);
  }

  const prompt = `You are a senior technical interviewer and career coach. Review the complete record of the mock interview for candidate ${profile.name}.

Candidate Profile:
- Experience Level: ${profile.experienceLevel}
- Technical Skills: ${profile.technicalSkills.join(', ')}
- Soft Skills: ${profile.softSkills.join(', ')}
- JD Matched Skills: ${profile.matchedSkills.join(', ')}
- JD Missing Skills: ${profile.missingSkills.join(', ')}

Interview Record (Questions, Answers, and Individual Evaluations):
${history.map((h, i) => `Question ${i + 1}: ${h.question}\nAnswer ${i + 1}: ${h.answer}\nScore: ${h.evaluation?.score || 0}/100\nFeedback: ${h.evaluation?.feedback}`).join('\n\n')}

Create a final comprehensive performance report.
Synthesize the results. Evaluate which core skills were demonstrated well and which were weak. Include overall score, skill-wise scores, comprehensive list of overall strengths, areas to improve, and actionable recommendations.

For each skill in skillBreakdown, base the score on actual answers given, not averages. Find which questions tested each skill and use those specific scores.

You must return a JSON response. The JSON object must have exactly these keys:
{
  "overallScore": Number (Average of individual scores, adjusted for overall performance, 0-100),
  "performanceRating": "String (e.g., 'Excellent', 'Proficient', 'Developing', 'Needs Attention')",
  "skillBreakdown": {
    "SkillName1": Number (Score 0-100, derived from questions that tested this specific skill),
    "SkillName2": Number (Score 0-100, derived from questions that tested this specific skill),
    "SkillName3": Number (Score 0-100, derived from questions that tested this specific skill)
  },
  "strengths": ["Array of Strings (Comprehensive strengths observed across the interview)"],
  "improvements": ["Array of Strings (Comprehensive areas to improve with actionable recommendations)"],
  "conclusion": "String (A supportive, professional closing note summarizing their readiness for the role)",
  "learningResources": [
    {
      "skill": "SkillName",
      "resource": "Specific course or book name",
      "url": "https://...",
      "reason": "Why this helps based on their gaps"
    }
  ],
  "interviewReadiness": Number (0-100, overall readiness score for real interviews),
  "estimatedPreparationDays": Number (Realistic number of days needed to be job-ready based on gaps)
}

Ensure the output is valid JSON.`;

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: "You are a professional career coach. You output ONLY valid JSON.",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await withRetry(() => model.generateContent(prompt));
    const text = result.response.text().trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error generating report with Gemini, falling back to mock:', error);
    return getMockReport(profile, history);
  }
}

// ==========================================
//          HIGH FIDELITY MOCK FALLBACKS
// ==========================================

function getMockProfile(resumeText, jdText, targetRole = 'Full Stack') {
  // Extract candidate name from resume text if possible
  let candidateName = 'Alex Mercer';
  if (resumeText) {
    const lines = resumeText.split('\n');
    for (const line of lines.slice(0, 5)) {
      if (line.trim().length > 2 && line.trim().length < 30 && !line.includes('@') && !line.includes(':')) {
        candidateName = line.trim();
        break;
      }
    }
  }

  // Parse experience from years mentioned (e.g. "3 years", "5 years", "10 years")
  let years = 3;
  const yearsRegex = /(\d+)\+?\s*yrs?\b|years?\b/i;
  const match = resumeText?.match(yearsRegex);
  if (match) {
    years = parseInt(match[1], 10);
  }

  let level = 'Mid';
  let explanation = 'Determined to be mid-level based on 3 years of detected experience.';
  if (years < 1) {
    level = 'Fresher';
    explanation = 'Detected 0-1 years of experience, categorizing as a Fresher.';
  } else if (years < 3) {
    level = 'Junior';
    explanation = 'Detected 1-3 years of experience, categorizing as a Junior developer.';
  } else if (years < 6) {
    level = 'Mid';
    explanation = `Detected ${years} years of experience, categorizing as a Mid-level professional.`;
  } else {
    level = 'Senior';
    explanation = `Detected ${years} years of experience with lead indicators. Categorized as Senior.`;
  }

  // Define skill list based on targetRole preset
  let techSkillList = ['JavaScript', 'React', 'HTML/CSS'];
  let jdSkillList = ['JavaScript', 'React', 'Node.js', 'SQL', 'Communication'];

  if (targetRole === 'Frontend Developer') {
    techSkillList = ['React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Git'];
    jdSkillList = ['React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Tailwind', 'Git'];
  } else if (targetRole === 'Backend Developer') {
    techSkillList = ['Node.js', 'Express', 'SQL', 'PostgreSQL', 'Git', 'AWS'];
    jdSkillList = ['Node.js', 'Express', 'SQL', 'PostgreSQL', 'MongoDB', 'System Design', 'Docker'];
  } else if (targetRole === 'Data Analyst') {
    techSkillList = ['SQL', 'Python', 'Excel', 'Problem Solving'];
    jdSkillList = ['SQL', 'Python', 'PostgreSQL', 'Tableau', 'Excel', 'Communication'];
  } else if (targetRole === 'Data Scientist') {
    techSkillList = ['Python', 'SQL', 'Machine Learning', 'Problem Solving'];
    jdSkillList = ['Python', 'SQL', 'Machine Learning', 'Statistics', 'R', 'Communication'];
  } else if (targetRole === 'ML Engineer') {
    techSkillList = ['Python', 'Machine Learning', 'Git', 'Docker'];
    jdSkillList = ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'System Design', 'Docker'];
  } else if (targetRole === 'GenAI Engineer') {
    techSkillList = ['Python', 'LangChain', 'JavaScript', 'Vector Databases'];
    jdSkillList = ['Python', 'LLMs', 'LangChain', 'OpenAI', 'Vector Databases', 'System Design'];
  } else if (targetRole === 'Full Stack') {
    techSkillList = ['React', 'Node.js', 'Express', 'JavaScript', 'TypeScript', 'SQL'];
    jdSkillList = ['React', 'Node.js', 'Express', 'JavaScript', 'TypeScript', 'SQL', 'System Design'];
  }

  const softSkillList = [
    'Communication', 'Teamwork', 'Problem Solving', 'Agile'
  ];

  const technicalSkills = [];
  const softSkills = [];
  const jdSkills = [];

  const resumeLower = (resumeText || '').toLowerCase();
  const jdLower = (jdText || '').toLowerCase();

  // Extract technical skills
  techSkillList.forEach(skill => {
    if (resumeLower.includes(skill.toLowerCase())) {
      technicalSkills.push(skill);
    }
    if (jdLower.includes(skill.toLowerCase())) {
      jdSkills.push(skill);
    }
  });

  // Extract soft skills
  softSkillList.forEach(skill => {
    if (resumeLower.includes(skill.toLowerCase())) {
      softSkills.push(skill);
    }
    if (jdLower.includes(skill.toLowerCase())) {
      jdSkills.push(skill);
    }
  });

  // Fallbacks if lists are empty
  if (technicalSkills.length === 0) {
    technicalSkills.push(...techSkillList.slice(0, 3));
  }
  if (softSkills.length === 0) {
    softSkills.push(...softSkillList.slice(0, 3));
  }
  if (jdSkills.length === 0) {
    jdSkills.push(...jdSkillList.slice(0, 3));
  }

  const combinedResumeSkills = [...technicalSkills, ...softSkills];
  const matchedSkills = combinedResumeSkills.filter(s => jdSkills.includes(s));
  const missingSkills = jdSkills.filter(s => !combinedResumeSkills.includes(s));

  // Compute a match percentage
  const totalJD = jdSkills.length;
  const matchedCount = matchedSkills.length;
  let matchPercentage = totalJD > 0 ? Math.round((matchedCount / totalJD) * 100) : 50;
  matchPercentage = Math.min(Math.max(matchPercentage, 45), 95);

  return {
    name: candidateName,
    experienceYears: years,
    experienceLevel: level,
    experienceExplanation: explanation,
    technicalSkills,
    softSkills,
    jdSkills,
    matchedSkills,
    missingSkills,
    matchPercentage,
    warmupGreeting: `Welcome, ${candidateName}. I've thoroughly reviewed your profile and matching alignment for the ${targetRole} position. Let's begin the interview.`,
    targetRole
  };
}

function getMockQuestion(profile, history, questionNumber) {
  const level = profile.experienceLevel;
  
  if (questionNumber === 1) {
    return `Hello ${profile.name}. To start off our interview, could you please introduce yourself and walk me through your career background, highlighting some of your core strengths?`;
  }
  
  if (questionNumber === 2) {
    return `Thank you for sharing that. Looking at the position requirements, what particularly interested you in this specific job description, and how do you see this role aligning with your long-term career goals?`;
  }

  // Technical questions (Q3 - Q7)
  if (questionNumber >= 3 && questionNumber <= 7) {
    const techIdx = questionNumber - 3;
    const combinedResumeSkills = [...profile.technicalSkills, ...profile.softSkills];
    const skillsToUse = profile.matchedSkills.length > 0 ? profile.matchedSkills : combinedResumeSkills;
    const skill = skillsToUse[techIdx % skillsToUse.length] || 'Software Engineering';

    // Tailor questions to skill + level
    if (level === 'Fresher') {
      const fresherQuestions = {
        'React': 'What is the Virtual DOM in React, and how does it improve UI rendering performance compared to the traditional DOM?',
        'Node.js': 'Can you explain the difference between asynchronous programming and synchronous programming in Node.js, and what callback hell is?',
        'JavaScript': 'What are the differences between `var`, `let`, and `const` variables in JavaScript? How does hoisting apply to them?',
        'Python': 'What are lists and tuples in Python? Explain the primary differences in mutability and usage cases.',
        'SQL': 'What is the difference between a INNER JOIN and a LEFT JOIN in SQL? Give a quick conceptual explanation.',
        'System Design': 'Conceptually, what is the client-server architecture, and how does HTTP request-response cycle work?',
        'default': `Can you explain the core fundamentals of ${skill} and describe its main benefits in software development?`
      };
      return fresherQuestions[skill] || fresherQuestions['default'];
    }

    if (level === 'Junior') {
      const juniorQuestions = {
        'React': 'How do you handle side effects in functional components using React? Describe the lifecycle synchronization behavior of the `useEffect` hook.',
        'Node.js': 'How does middleware work in Express? Can you explain how you would create custom middleware to validate incoming request data?',
        'JavaScript': 'What are Promises in JavaScript, and how do they resolve asynchronous operations? Compare them briefly to the `async/await` syntax.',
        'Python': 'How do you handle exceptions in Python? Explain the role of the `try`, `except`, and `finally` blocks in production code.',
        'SQL': 'What is SQL injection, and what are the best practices for writing secure queries in Node/Python to prevent it?',
        'System Design': 'What is a load balancer, and why would you introduce one into your system architecture as traffic increases?',
        'default': `In your practical experience, what is a common challenge you face when working with ${skill}, and how do you resolve it?`
      };
      return juniorQuestions[skill] || juniorQuestions['default'];
    }

    if (level === 'Mid') {
      const midQuestions = {
        'React': 'Explain React reconciliation and state management. When would you use Context API over a state library like Redux or Zustand, and what are the performance trade-offs?',
        'Node.js': 'Explain how the Node.js event loop functions, specifically detailing the phases (timers, poll, check) and how CPU-intensive tasks block the loop.',
        'JavaScript': 'Explain closures in JavaScript. How would you use a closure to create a private variable, and what are the potential memory leak risks?',
        'Python': 'What are Python decorators, and how do they modify function behavior? Give an example of how you would write a decorator for logging or timing execution.',
        'SQL': 'What is database indexing? Explain the difference between clustered and non-clustered indexes, and how indexing affects write vs read performance.',
        'System Design': 'How would you design a caching layer using Redis for a relational database? What cache invalidation strategies would you consider?',
        'default': `How would you structure a modular project utilizing ${skill}? How do you handle unit testing and dependency management?`
      };
      return midQuestions[skill] || midQuestions['default'];
    }

    // Senior level
    const seniorQuestions = {
      'React': 'Design a micro-frontend architecture using React module federation. How would you manage shared state, global styles, and route synchronization across independent packages?',
      'Node.js': 'How do you design high-throughput Node.js microservices? Explain how you manage inter-service communication (gRPC vs RabbitMQ/Kafka) and process clustering.',
      'JavaScript': 'Detail memory management in Chrome V8. How does garbage collection function (Scavenger vs Mark-Sweep-Compact), and how do you profile and debug memory issues?',
      'Python': 'Describe how concurrency is handled in Python. Contrast multithreading (and the GIL), multiprocessing, and asyncio for network-bound vs CPU-bound tasks.',
      'SQL': 'Discuss database partitioning, sharding, and replication. In a write-heavy application, how would you design PostgreSQL to scale horizontally while maintaining ACID guarantees?',
      'System Design': 'Design a real-time collaborative editing platform like Google Docs. How do you handle conflict resolution (OT vs CRDT), web socket scale, and durability layers?',
      'default': `Explain the core architectural trade-offs when deploying ${skill} in a global enterprise system. How do you address scalability, observability, and cost?`
    };
    return seniorQuestions[skill] || seniorQuestions['default'];
  }

  // Behavioral questions (Q8 - Q9)
  if (questionNumber === 8) {
    return "Describe a time when you had to work with a difficult coworker or stakeholder. What was the conflict, how did you approach resolving it using the STAR format, and what was the outcome?";
  }
  
  if (questionNumber === 9) {
    return "Could you share an example of a technical project that did not go according to plan? What went wrong, how did you adapt, and what key lessons did you carry forward to your next projects?";
  }

  // Situational question (Q10)
  return "Imagine you have just deployed a feature to production, and users report a major performance slowdown. The Engineering Manager wants an immediate rollback, but the Product Manager insists on keeping it live to gather user engagement metrics. How do you evaluate this scenario, and what steps do you take?";
}

function getMockAnswerEvaluation(question, answer, profile) {
  // Keyword-based scoring: extract meaningful words (length > 4) from the question
  const questionWords = question.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 4);
  const answerLower = (answer || '').toLowerCase();
  const matchedKeywords = questionWords.filter(w => answerLower.includes(w));
  const keywordScore = Math.min(
    (matchedKeywords.length / Math.max(questionWords.length, 1)) * 100, 100
  );
  const lengthBonus = Math.min(
    (answer || '').trim().split(/\s+/).length / 150 * 20, 20
  );
  let score = Math.round(Math.min(keywordScore * 0.8 + lengthBonus, 100));

  // Adjust score slightly based on experience level
  if (profile.experienceLevel === 'Senior') {
    score = Math.max(score - 5, 40);
  } else if (profile.experienceLevel === 'Fresher') {
    score = Math.min(score + 5, 100);
  }

  // Clamp score to [0, 100]
  score = Math.min(Math.max(score, 0), 100);

  let feedback = "A reasonable attempt. The answer addresses the core question but lacks deeper technical depth or concrete project examples.";
  let strengths = ["Clear presentation", "Addressed the primary topic"];
  let improvements = ["Provide specific examples", "Explain the underlying architecture"];
  let idealAnswerHints = [
    "Define the core concept with precise technical terminology",
    "Illustrate with a concrete real-world example or past project scenario",
    "Discuss trade-offs, limitations, or alternative approaches"
  ];

  if (score < 50) {
    feedback = "Your answer is too brief or misses the key concepts of the question. Expand your response with relevant technical terms and examples.";
    strengths = ["Attempted the question"];
    improvements = ["Elaborate further", "Cover key technical terms from the question directly"];
  } else if (score >= 90) {
    feedback = "Excellent! You demonstrated strong keyword coverage, gave a well-structured answer, and showed clear mastery of the topic.";
    strengths = ["Comprehensive keyword coverage", "Strong conceptual clarity"];
    improvements = ["Refine conciseness when summarizing key points"];
  } else if (score >= 70) {
    feedback = "A solid, well-rounded answer. You cover most of the key terms and show good understanding. Adding more concrete examples would elevate this further.";
    strengths = ["Good technical vocabulary", "Structured explanation"];
    improvements = ["Include measurable outcomes or real-world trade-offs"];
  }

  // Derive mock criteriaScores from the overall score
  const correctness = Math.round(Math.min((score / 100) * 30, 30));
  const depth = Math.round(Math.min((score / 100) * 25, 25));
  const realWorld = answerLower.includes('example') || answerLower.includes('project') || answerLower.includes('scenario')
    ? Math.round(Math.min((score / 100) * 25 + 5, 25))
    : Math.round(Math.min((score / 100) * 25 * 0.6, 25));
  const communication = Math.round(Math.min((score / 100) * 20, 20));

  return {
    score,
    feedback,
    strengths,
    improvements,
    idealAnswerHints,
    criteriaScores: { correctness, depth, realWorld, communication }
  };
}

function getMockReport(profile, history) {
  const scores = history.map(h => h.evaluation?.score || 75);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  let rating = 'Developing';
  let conclusion = "You have shown a good foundation, but would benefit from further study in core technical areas.";
  if (avg >= 90) {
    rating = 'Excellent';
    conclusion = `Outstanding job! You demonstrated deep expertise, great communication, and strong adaptation to the ${profile.experienceLevel} level requirements.`;
  } else if (avg >= 75) {
    rating = 'Proficient';
    conclusion = `Very good performance. You are well-suited for the role, though patching a few technical gaps will make you an even stronger candidate.`;
  } else if (avg >= 55) {
    rating = 'Developing';
    conclusion = `Decent effort. Work on expanding your theoretical knowledge and backing up answers with the STAR framework.`;
  } else {
    rating = 'Needs Attention';
    conclusion = `It appears you need to brush up on several fundamental concepts related to the Job Description. Try reviewing the missing skills.`;
  }

  const skillBreakdown = {};
  const combinedSkills = [...profile.technicalSkills, ...profile.softSkills];
  combinedSkills.slice(0, 5).forEach((skill, idx) => {
    skillBreakdown[skill] = history[idx]?.evaluation?.score ?? avg;
  });

  if (Object.keys(skillBreakdown).length === 0) {
    skillBreakdown['Software Engineering'] = avg;
    skillBreakdown['Communication'] = Math.min(avg + 10, 95);
  }

  return {
    overallScore: avg,
    performanceRating: rating,
    skillBreakdown,
    strengths: [
      "Demonstrates solid communication during initial warm-up and introductory questions.",
      "Clear articulation of primary technologies listed on the resume.",
      "Structured behavioral approach, adhering to core team communication principles."
    ],
    improvements: [
      `Strengthen depth in key missing skills: ${profile.missingSkills.slice(0, 3).join(', ') || 'System Design'}.`,
      "For technical answers, describe runtime complexity or database schema implications where applicable.",
      "Expand STAR responses with measurable metrics (e.g. percentages, durations, team size)."
    ],
    conclusion
  };
}
