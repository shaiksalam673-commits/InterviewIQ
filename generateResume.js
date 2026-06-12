import { jsPDF } from 'jspdf';
import fs from 'fs';

const doc = new jsPDF();
doc.setFont('Helvetica', 'bold');
doc.setFontSize(22);
doc.text('John Doe', 20, 20);

doc.setFont('Helvetica', 'normal');
doc.setFontSize(12);
doc.text('Email: john.doe@example.com | Phone: +1 555-0199', 20, 28);
doc.text('Portfolio: github.com/johndoe | Location: San Francisco, CA', 20, 34);

doc.setFont('Helvetica', 'bold');
doc.setFontSize(16);
doc.text('Summary', 20, 46);
doc.line(20, 48, 190, 48);

doc.setFont('Helvetica', 'normal');
doc.setFontSize(11);
const summary = 'Experienced Software Engineer with over 4 years of expertise in designing, building, and deploying scalable web applications. Comfortable with frontend React frameworks and backend Node.js services. Passionate about writing clean, modular code, database optimization, and cloud operations.';
const splitSummary = doc.splitTextToSize(summary, 170);
doc.text(splitSummary, 20, 54);

doc.setFont('Helvetica', 'bold');
doc.setFontSize(16);
doc.text('Skills', 20, 75);
doc.line(20, 77, 190, 77);

doc.setFont('Helvetica', 'normal');
doc.setFontSize(11);
doc.text('• Frontend: React, Redux, Tailwind CSS, JavaScript, HTML5, CSS3', 20, 83);
doc.text('• Backend: Node.js, Express, REST APIs, Python, Fast API', 20, 89);
doc.text('• Databases & Tools: SQL, PostgreSQL, MongoDB, Git, Docker, AWS', 20, 95);

doc.setFont('Helvetica', 'bold');
doc.setFontSize(16);
doc.text('Experience', 20, 110);
doc.line(20, 112, 190, 112);

doc.setFont('Helvetica', 'bold');
doc.setFontSize(12);
doc.text('Senior Software Engineer - TechVanguard Corp', 20, 119);
doc.setFont('Helvetica', 'normal');
doc.setFontSize(10);
doc.text('2024 - Present (2 Years)', 190, 119, { align: 'right' });
doc.setFontSize(11);
doc.text('• Led development of a high-traffic e-commerce portal, increasing conversion rate by 15%.', 20, 125);
doc.text('• Optimized SQL query performance in PostgreSQL, reducing api response latency by 30%.', 20, 131);
doc.text('• Mentored 3 junior developers and instituted code review standards.', 20, 137);

doc.setFont('Helvetica', 'bold');
doc.setFontSize(12);
doc.text('Software Developer - Innovate Solutions', 20, 149);
doc.setFont('Helvetica', 'normal');
doc.setFontSize(10);
doc.text('2022 - 2024 (2 Years)', 190, 149, { align: 'right' });
doc.setFontSize(11);
doc.text('• Developed responsive user interfaces in React and state management using Redux.', 20, 155);
doc.text('• Integrated external REST APIs and built microservices in Node.js and Express.', 20, 161);

const arrayBuffer = doc.output('arraybuffer');
fs.writeFileSync('resume.pdf', Buffer.from(arrayBuffer));
console.log('✅ resume.pdf created successfully.');
