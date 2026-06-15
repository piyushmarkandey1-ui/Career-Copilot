/**
 * localAnalyzer.js
 *
 * A rule-based resume analyzer that reads the actual resume text
 * and produces content-specific, realistic feedback — no AI API needed.
 *
 * Used as a fallback when the Anthropic API key is missing or invalid.
 */

// ── Keyword dictionaries ─────────────────────────────────────────────────────

const ROLE_SKILLS = {
  'Frontend Developer': {
    core: ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'next.js', 'redux', 'webpack', 'vite'],
    bonus: ['graphql', 'testing', 'jest', 'storybook', 'figma', 'accessibility', 'seo', 'performance'],
    ats: ['react', 'javascript', 'typescript', 'css', 'responsive design', 'frontend'],
  },
  'Backend Developer': {
    core: ['node.js', 'express', 'python', 'django', 'flask', 'java', 'spring', 'go', 'sql', 'mongodb', 'postgresql', 'redis', 'rest api'],
    bonus: ['microservices', 'docker', 'kubernetes', 'kafka', 'rabbitmq', 'grpc', 'graphql'],
    ats: ['backend', 'api', 'database', 'server', 'rest', 'node', 'python'],
  },
  'Full Stack Developer': {
    core: ['react', 'node.js', 'javascript', 'typescript', 'sql', 'mongodb', 'rest api', 'html', 'css'],
    bonus: ['docker', 'aws', 'ci/cd', 'graphql', 'next.js', 'testing'],
    ats: ['full stack', 'frontend', 'backend', 'react', 'node', 'javascript'],
  },
  'Software Developer (SDE)': {
    core: ['data structures', 'algorithms', 'java', 'c++', 'python', 'system design', 'oop', 'sql'],
    bonus: ['distributed systems', 'microservices', 'cloud', 'docker', 'kubernetes', 'leetcode'],
    ats: ['software engineer', 'algorithms', 'data structures', 'system design', 'oop'],
  },
  'Data Scientist / ML Engineer': {
    core: ['python', 'machine learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'sql', 'statistics'],
    bonus: ['deep learning', 'nlp', 'computer vision', 'spark', 'hadoop', 'airflow', 'mlflow'],
    ats: ['machine learning', 'data science', 'python', 'model', 'neural network', 'analytics'],
  },
  'DevOps / Cloud Engineer': {
    core: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ci/cd', 'jenkins', 'linux', 'bash'],
    bonus: ['ansible', 'helm', 'prometheus', 'grafana', 'elk stack', 'istio'],
    ats: ['devops', 'cloud', 'deployment', 'infrastructure', 'docker', 'kubernetes'],
  },
  'Product Manager': {
    core: ['product roadmap', 'user stories', 'agile', 'scrum', 'stakeholder', 'kpi', 'a/b testing', 'analytics'],
    bonus: ['jira', 'figma', 'sql', 'market research', 'go-to-market', 'okr'],
    ats: ['product manager', 'roadmap', 'agile', 'user stories', 'stakeholder'],
  },
  'Blockchain Developer': {
    core: ['solidity', 'ethereum', 'web3', 'smart contracts', 'defi', 'nft', 'truffle', 'hardhat'],
    bonus: ['rust', 'solana', 'polygon', 'ipfs', 'defi protocols', 'dao'],
    ats: ['blockchain', 'smart contract', 'solidity', 'web3', 'ethereum', 'defi'],
  },
  'Cybersecurity Analyst': {
    core: ['penetration testing', 'vulnerability assessment', 'siem', 'firewall', 'network security', 'incident response'],
    bonus: ['ceh', 'cissp', 'oscp', 'kali linux', 'threat intelligence', 'forensics'],
    ats: ['cybersecurity', 'security', 'penetration testing', 'vulnerability', 'incident response'],
  },
  'UI/UX Designer': {
    core: ['figma', 'user research', 'wireframes', 'prototyping', 'usability testing', 'design systems', 'adobe xd'],
    bonus: ['sketch', 'invision', 'motion design', 'accessibility', 'information architecture'],
    ats: ['ui/ux', 'figma', 'user research', 'prototyping', 'design', 'wireframes'],
  },
};

const IMPACT_PATTERNS = [
  /\d+%/,                        // percentages
  /\$[\d,]+/,                    // dollar amounts
  /\d+[kmb]\+?/i,                // numbers like 10k, 2M
  /reduced|improved|increased|optimized|saved|scaled|built|launched|led|managed|delivered/i,
  /\d+ (users|clients|team|members|engineers|services|apis)/i,
];

const STRUCTURE_SECTIONS = ['experience', 'education', 'skills', 'projects', 'summary', 'objective', 'certifications', 'achievements', 'contact'];
const CONTACT_FIELDS = ['github', 'linkedin', 'portfolio', 'email', 'phone'];

// ── Core analyzer ────────────────────────────────────────────────────────────

function analyzeLocally(resumeText, targetRole) {
  const text = resumeText.toLowerCase();
  const lines = resumeText.split('\n').filter(l => l.trim());
  const words = resumeText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const roleConfig = ROLE_SKILLS[targetRole] || ROLE_SKILLS['Software Developer (SDE)'];

  // ── 1. Keyword detection ──────────────────────────────────────────────────
  const foundCoreSkills = roleConfig.core.filter(sk => text.includes(sk.toLowerCase()));
  const missingCoreSkills = roleConfig.core.filter(sk => !text.includes(sk.toLowerCase())).slice(0, 4);
  const foundBonusSkills = roleConfig.bonus.filter(sk => text.includes(sk.toLowerCase()));
  const foundAtsKeywords = roleConfig.ats.filter(kw => text.includes(kw.toLowerCase()));

  // ── 2. Structure detection ─────────────────────────────────────────────────
  const foundSections = STRUCTURE_SECTIONS.filter(s => text.includes(s));
  const missingSections = STRUCTURE_SECTIONS.filter(s => !text.includes(s) && ['experience', 'education', 'skills'].includes(s));

  // ── 3. Contact info ────────────────────────────────────────────────────────
  const hasGithub = text.includes('github');
  const hasLinkedin = text.includes('linkedin');
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(text);
  const hasPhone = /(\+?\d[\d\s\-().]{7,}\d)/.test(resumeText);
  const hasPortfolio = /portfolio|personal site|website/.test(text);

  // ── 4. Impact metrics ──────────────────────────────────────────────────────
  const impactCount = IMPACT_PATTERNS.filter(p => p.test(resumeText)).length;
  const hasMetrics = impactCount >= 2;
  const bulletCount = lines.filter(l => /^[-•*▪➤]/.test(l.trim())).length;

  // ── 5. Education ───────────────────────────────────────────────────────────
  const hasDegree = /b\.?tech|b\.?e\.?|bachelor|master|m\.?tech|phd|b\.?sc|computer science|information technology/i.test(resumeText);
  const hasGpa = /gpa|cgpa|percentage|marks/.test(text);
  const hasPremiumCollege = /iit|nit|bits|iiit|vit|srm|du|delhi university|bombay|bangalore|hyderabad/i.test(resumeText);

  // ── 6. Projects ────────────────────────────────────────────────────────────
  const hasProjects = text.includes('project');
  const hasGithubLinks = /github\.com\//i.test(resumeText);
  const hasLiveLinks = /https?:\/\/(?!github\.com)[a-z0-9.-]+/i.test(resumeText);
  const projectCount = (resumeText.match(/project\s*\d*\s*:/gi) || resumeText.match(/project\s*[-–—]/gi) || []).length;

  // ── 7. Experience ──────────────────────────────────────────────────────────
  const hasExperience = /internship|experience|worked at|employed|company|organization/.test(text);
  const hasLeadership = /led|managed|mentored|coordinated|oversaw|supervised/.test(text);
  const hasActionVerbs = /developed|built|designed|implemented|created|deployed|optimized|integrated/.test(text);

  // ── 8. Certifications ──────────────────────────────────────────────────────
  const hasCerts = /certification|certified|aws|google cloud|coursera|udemy|hackerrank|leetcode/i.test(resumeText);

  // ── Score calculation ─────────────────────────────────────────────────────
  let score = 40; // base

  // Core skills (up to 20 pts)
  score += Math.min(20, Math.round((foundCoreSkills.length / roleConfig.core.length) * 20));

  // Bonus skills (up to 5 pts)
  score += Math.min(5, foundBonusSkills.length * 1);

  // Contact completeness (up to 8 pts)
  score += hasEmail ? 2 : 0;
  score += hasPhone ? 1 : 0;
  score += hasGithub ? 3 : 0;
  score += hasLinkedin ? 2 : 0;

  // Structure (up to 5 pts)
  score += Math.min(5, foundSections.length);

  // Metrics & impact (up to 7 pts)
  score += hasMetrics ? 5 : 0;
  score += impactCount >= 4 ? 2 : 0;

  // Projects (up to 6 pts)
  score += hasProjects ? 3 : 0;
  score += hasGithubLinks ? 2 : 0;
  score += hasLiveLinks ? 1 : 0;

  // Experience (up to 5 pts)
  score += hasExperience ? 3 : 0;
  score += hasLeadership ? 2 : 0;

  // Education (up to 4 pts)
  score += hasDegree ? 3 : 0;
  score += hasPremiumCollege ? 1 : 0;

  score = Math.min(97, Math.max(18, score));

  // ── Build response ────────────────────────────────────────────────────────

  const strengths = [];
  const weaknesses = [];
  const roadmap = [];

  // Strengths
  if (foundCoreSkills.length >= roleConfig.core.length * 0.5) {
    strengths.push(`Strong coverage of core ${targetRole} skills: ${foundCoreSkills.slice(0, 3).join(', ')}.`);
  }
  if (hasMetrics) strengths.push('Uses quantifiable metrics and impact statements in bullet points.');
  if (hasGithub && hasLinkedin) strengths.push('Good online presence with GitHub and LinkedIn profiles linked.');
  if (hasProjects && hasGithubLinks) strengths.push('Projects include GitHub repository links, improving credibility.');
  if (hasDegree) strengths.push(`Relevant educational background${hasPremiumCollege ? ' from a well-known institution' : ''}.`);
  if (hasExperience && hasActionVerbs) strengths.push('Uses strong action verbs to describe experience and contributions.');
  if (hasCerts) strengths.push('Certifications or competitive programming activity adds credibility.');
  if (foundBonusSkills.length >= 2) strengths.push(`Knowledge of bonus technologies: ${foundBonusSkills.slice(0, 2).join(', ')}.`);
  if (wordCount > 400) strengths.push('Comprehensive resume with sufficient detail across sections.');

  if (strengths.length === 0) strengths.push('Resume has been successfully parsed and contains identifiable content.');

  // Weaknesses
  if (missingCoreSkills.length > 0) {
    weaknesses.push(`Missing key ${targetRole} skills: ${missingCoreSkills.join(', ')}.`);
  }
  if (!hasMetrics) weaknesses.push('Bullet points lack quantifiable achievements — no percentages, numbers, or measurable outcomes.');
  if (!hasGithub) weaknesses.push('No GitHub profile linked — critical for technical roles.');
  if (!hasLinkedin) weaknesses.push('LinkedIn profile is missing from contact information.');
  if (!hasProjects) weaknesses.push('No projects section found — projects are essential for showcasing practical skills.');
  else if (!hasGithubLinks) weaknesses.push('Projects listed but no GitHub links provided to verify the work.');
  if (!hasExperience) weaknesses.push('No internship or professional experience detected — consider adding even short-term roles.');
  if (!hasCerts) weaknesses.push('No certifications or online courses mentioned — these add credibility for entry-level profiles.');
  if (wordCount < 200) weaknesses.push('Resume is too brief. Add more detail to projects, responsibilities, and achievements.');
  if (missingSections.length > 0) weaknesses.push(`Missing standard sections: ${missingSections.join(', ')}.`);

  // Roadmap
  if (!hasMetrics) roadmap.push(`Quantify your bullet points: e.g., "Reduced API response time by 40%" instead of "Improved performance".`);
  if (missingCoreSkills.length > 0) roadmap.push(`Add missing ${targetRole} skills to your skills section: ${missingCoreSkills.slice(0, 2).join(', ')}.`);
  if (!hasGithub) roadmap.push('Create a GitHub profile and upload your projects with clean README files.');
  if (!hasLinkedin) roadmap.push('Create and optimize a LinkedIn profile with the same information as your resume.');
  if (hasProjects && !hasGithubLinks) roadmap.push('Add GitHub links (and live demo links if available) to every project entry.');
  if (!hasExperience) roadmap.push('Apply for internships or contribute to open-source projects to build experience.');
  if (!hasCerts) roadmap.push('Complete a relevant certification (e.g., AWS Certified, Google Associate, or a Coursera specialization).');
  if (wordCount < 300) roadmap.push('Expand project descriptions to 2-3 bullet points each, focusing on your contribution and results.');
  roadmap.push(`Tailor your resume summary specifically for the ${targetRole} role you are targeting.`);

  // Section feedback
  const structureFeedback = [
    foundSections.length >= 5
      ? 'Resume structure is well-organized with most standard sections present.'
      : `Resume is missing ${missingSections.length > 0 ? missingSections.join(', ') : 'some'} sections. Add clear section headers for better readability.`,
    bulletCount > 5 ? 'Good use of bullet points to organize information.' : 'Use more bullet points to break down responsibilities into scannable items.',
    wordCount > 600 ? 'Resume may be slightly long. Keep it to 1 page if under 2 years of experience.' : 'Length is appropriate.',
  ].join(' ');

  const projectFeedback = hasProjects
    ? [
        `${projectCount > 1 ? `${projectCount} projects identified.` : 'Projects section found.'}`,
        hasGithubLinks ? 'GitHub links are present — good.' : 'Add GitHub links to all projects.',
        hasLiveLinks ? 'Live demo links present.' : 'Add live deployment links where possible.',
        'Describe the problem each project solves, not just the technologies used.',
      ].join(' ')
    : `No projects section found. For a ${targetRole} role, projects are essential. Build and deploy 2-3 projects showcasing the core required skills.`;

  const skillsFeedback = [
    foundCoreSkills.length > 0
      ? `You have ${foundCoreSkills.length} of ${roleConfig.core.length} core skills for ${targetRole}: ${foundCoreSkills.slice(0, 4).join(', ')}.`
      : `No core ${targetRole} skills detected. Ensure your skills section clearly lists relevant technologies.`,
    missingCoreSkills.length > 0 ? `Consider adding: ${missingCoreSkills.join(', ')}.` : 'Core skills coverage is strong.',
    `ATS keyword match: ${foundAtsKeywords.length}/${roleConfig.ats.length} keywords found.`,
  ].join(' ');

  const targetRoleFit = [
    score >= 75 ? `Your profile is a strong match for ${targetRole} roles.` :
    score >= 55 ? `Your profile is a moderate match for ${targetRole} roles with some gaps.` :
                  `Your profile currently has significant gaps for the ${targetRole} role.`,
    foundCoreSkills.length >= roleConfig.core.length * 0.6
      ? 'Technical skills are well aligned.'
      : `Build stronger coverage of core ${targetRole} technologies.`,
    hasExperience ? 'Work experience adds credibility to your application.' : 'Lack of experience is a major gap — internships or open-source work can compensate.',
  ].join(' ');

  const summary = [
    score >= 75 ? 'Solid resume with good technical alignment' :
    score >= 55 ? 'Resume shows potential but has notable gaps' :
                  'Resume needs significant improvements',
    `for the ${targetRole} role.`,
    !hasMetrics ? 'Add metrics to bullet points.' : '',
    missingCoreSkills.length > 0 ? `Include ${missingCoreSkills[0]}.` : '',
  ].filter(Boolean).join(' ').trim();

  return {
    readiness_score: score,
    summary,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    resume_structure_feedback: structureFeedback,
    project_feedback: projectFeedback,
    skills_feedback: skillsFeedback,
    target_role_fit: targetRoleFit,
    improvement_roadmap: roadmap.slice(0, 6),
  };
}

module.exports = { analyzeLocally };
