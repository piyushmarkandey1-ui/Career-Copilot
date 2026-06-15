/**
 * localAnalyzer.js — Evidence-Based Resume Analyzer
 *
 * Extracts actual content (project names, companies, skills, colleges,
 * certifications) from the resume text and generates personalized,
 * evidence-based feedback that references specifics — not templates.
 */

// ── Role skill dictionaries ───────────────────────────────────────────────────

const ROLE_SKILLS = {
  'Frontend Developer': {
    core: ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'next.js', 'redux', 'webpack', 'vite'],
    bonus: ['graphql', 'jest', 'storybook', 'figma', 'accessibility', 'seo', 'performance', 'cypress', 'playwright'],
    ats: ['react', 'javascript', 'typescript', 'css', 'responsive design', 'frontend'],
    roleHint: 'frontend engineer',
  },
  'Backend Developer': {
    core: ['node.js', 'express', 'python', 'django', 'flask', 'java', 'spring', 'go', 'sql', 'mongodb', 'postgresql', 'redis', 'rest api'],
    bonus: ['microservices', 'docker', 'kubernetes', 'kafka', 'rabbitmq', 'grpc', 'graphql', 'fastapi'],
    ats: ['backend', 'api', 'database', 'server', 'rest', 'node', 'python'],
    roleHint: 'backend engineer',
  },
  'Full Stack Developer': {
    core: ['react', 'node.js', 'javascript', 'typescript', 'sql', 'mongodb', 'rest api', 'html', 'css'],
    bonus: ['docker', 'aws', 'ci/cd', 'graphql', 'next.js', 'testing', 'redis'],
    ats: ['full stack', 'frontend', 'backend', 'react', 'node', 'javascript'],
    roleHint: 'full stack engineer',
  },
  'Software Developer (SDE)': {
    core: ['data structures', 'algorithms', 'java', 'c++', 'python', 'system design', 'oop', 'sql'],
    bonus: ['distributed systems', 'microservices', 'cloud', 'docker', 'kubernetes', 'leetcode', 'competitive programming'],
    ats: ['software engineer', 'algorithms', 'data structures', 'system design', 'oop'],
    roleHint: 'software development engineer',
  },
  'Data Scientist / ML Engineer': {
    core: ['python', 'machine learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'sql', 'statistics'],
    bonus: ['deep learning', 'nlp', 'computer vision', 'spark', 'hadoop', 'airflow', 'mlflow', 'huggingface'],
    ats: ['machine learning', 'data science', 'python', 'model', 'neural network', 'analytics'],
    roleHint: 'machine learning engineer',
  },
  'DevOps / Cloud Engineer': {
    core: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ci/cd', 'jenkins', 'linux', 'bash'],
    bonus: ['ansible', 'helm', 'prometheus', 'grafana', 'elk stack', 'istio', 'argocd'],
    ats: ['devops', 'cloud', 'deployment', 'infrastructure', 'docker', 'kubernetes'],
    roleHint: 'devops / cloud engineer',
  },
  'Product Manager': {
    core: ['product roadmap', 'user stories', 'agile', 'scrum', 'stakeholder', 'kpi', 'a/b testing', 'analytics'],
    bonus: ['jira', 'figma', 'sql', 'market research', 'go-to-market', 'okr', 'north star metric'],
    ats: ['product manager', 'roadmap', 'agile', 'user stories', 'stakeholder'],
    roleHint: 'product manager',
  },
  'Blockchain Developer': {
    core: ['solidity', 'ethereum', 'web3', 'smart contracts', 'defi', 'nft', 'truffle', 'hardhat'],
    bonus: ['rust', 'solana', 'polygon', 'ipfs', 'dao', 'layer 2', 'chainlink'],
    ats: ['blockchain', 'smart contract', 'solidity', 'web3', 'ethereum', 'defi'],
    roleHint: 'blockchain developer',
  },
  'Cybersecurity Analyst': {
    core: ['penetration testing', 'vulnerability assessment', 'siem', 'firewall', 'network security', 'incident response'],
    bonus: ['ceh', 'cissp', 'oscp', 'kali linux', 'threat intelligence', 'forensics', 'splunk'],
    ats: ['cybersecurity', 'security', 'penetration testing', 'vulnerability', 'incident response'],
    roleHint: 'cybersecurity analyst',
  },
  'UI/UX Designer': {
    core: ['figma', 'user research', 'wireframes', 'prototyping', 'usability testing', 'design systems', 'adobe xd'],
    bonus: ['sketch', 'invision', 'motion design', 'accessibility', 'information architecture', 'design tokens'],
    ats: ['ui/ux', 'figma', 'user research', 'prototyping', 'design', 'wireframes'],
    roleHint: 'ui/ux designer',
  },
};

// ── Entity extractors ────────────────────────────────────────────────────────

function extractProjectNames(text) {
  const names = [];
  // Look for lines that appear to be project titles (title case, short, not bullet points)
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Typical project title: 1-6 words, title-cased or all-caps, not a bullet
    if (
      trimmed.length > 3 && trimmed.length < 60 &&
      !/^[-•*▪➤\d]/.test(trimmed) &&
      /^[A-Z]/.test(trimmed) &&
      !/^(education|experience|skills|projects|achievements|certifications|summary|objective|contact|internship|work|profile|about)/i.test(trimmed) &&
      /[A-Z][a-z]|[A-Z]{2,}/.test(trimmed) &&
      trimmed.split(' ').length <= 8 &&
      trimmed.split(' ').length >= 2
    ) {
      names.push(trimmed.replace(/[|–—:].*/g, '').trim());
    }
  }
  return [...new Set(names)].slice(0, 5);
}

function extractCompanyNames(text) {
  const companies = [];
  const lines = text.split('\n');
  for (const line of lines) {
    // Look for lines that mention common company patterns
    const match = line.match(/(?:at|@|—|-)\s+([A-Z][A-Za-z0-9\s&.]+?)(?:\s*[|(]|\s+\d{4}|$)/);
    if (match && match[1] && match[1].trim().length > 2) {
      companies.push(match[1].trim());
    }
  }
  return [...new Set(companies)].slice(0, 3);
}

function extractCollegeName(text) {
  const premiumColleges = ['iit', 'nit', 'bits pilani', 'iiit', 'iim', 'vit', 'srm', 'manipal', 'lpu', 'amity'];
  const lower = text.toLowerCase();
  for (const college of premiumColleges) {
    if (lower.includes(college)) return college.toUpperCase();
  }
  // Generic extraction
  const match = text.match(/(?:from|at|–|—|-)\s+([A-Z][A-Za-z\s]+(?:University|College|Institute|Technology|IIT|NIT|BITS))/);
  if (match) return match[1].trim();
  return null;
}

function extractSkillsFromText(text, skillsList) {
  const lower = text.toLowerCase();
  return skillsList.filter(sk => lower.includes(sk.toLowerCase()));
}

function extractMetricExamples(text) {
  const examples = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (/\d+%|\$[\d,]+|\d+[kmb]\+?/i.test(line)) {
      examples.push(line.trim().replace(/^[-•*▪➤]\s*/, '').slice(0, 120));
    }
  }
  return examples.slice(0, 2);
}

function extractBulletLines(text) {
  return text.split('\n')
    .map(l => l.trim())
    .filter(l => /^[-•*▪➤]/.test(l))
    .map(l => l.replace(/^[-•*▪➤]\s*/, ''))
    .slice(0, 6);
}

function extractDegreeInfo(text) {
  const match = text.match(/(B\.?Tech|B\.?E\.?|Bachelor|Master|M\.?Tech|PhD|B\.?Sc)[^,\n]{0,60}/i);
  return match ? match[0].trim() : null;
}

function extractGitHubUrl(text) {
  const match = text.match(/github\.com\/([A-Za-z0-9_-]+)/i);
  return match ? `github.com/${match[1]}` : null;
}

function extractLinkedInUrl(text) {
  const match = text.match(/linkedin\.com\/in\/([A-Za-z0-9_-]+)/i);
  return match ? `linkedin.com/in/${match[1]}` : null;
}

function extractLiveUrls(text) {
  const urls = [];
  const regex = /https?:\/\/(?!github\.com)[a-zA-Z0-9.-]+\.[a-z]{2,}[^\s]*/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    urls.push(match[0].slice(0, 60));
  }
  return urls.slice(0, 2);
}

function extractCertifications(text) {
  const certs = [];
  const certKeywords = ['aws certified', 'google certified', 'azure certified', 'coursera', 'udemy', 'hackerrank', 'leetcode', 'ceh', 'cissp', 'oscp', 'certified'];
  const lines = text.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (certKeywords.some(k => lower.includes(k))) {
      certs.push(line.trim().replace(/^[-•*▪➤]\s*/, '').slice(0, 80));
    }
  }
  return [...new Set(certs)].slice(0, 3);
}

// ── Sentence variation helpers ───────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Main analyzer ────────────────────────────────────────────────────────────

function analyzeLocally(resumeText, targetRole) {
  const text = resumeText.toLowerCase();
  const lines = resumeText.split('\n').filter(l => l.trim());
  const words = resumeText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const roleConfig = ROLE_SKILLS[targetRole] || ROLE_SKILLS['Software Developer (SDE)'];

  // ── Entity extraction ─────────────────────────────────────────────────────
  const projectNames = extractProjectNames(resumeText);
  const companyNames = extractCompanyNames(resumeText);
  const collegeName = extractCollegeName(resumeText);
  const degreeInfo = extractDegreeInfo(resumeText);
  const githubUrl = extractGitHubUrl(resumeText);
  const linkedinUrl = extractLinkedInUrl(resumeText);
  const liveUrls = extractLiveUrls(resumeText);
  const certifications = extractCertifications(resumeText);
  const metricExamples = extractMetricExamples(resumeText);
  const bulletLines = extractBulletLines(resumeText);

  // ── Skill detection ───────────────────────────────────────────────────────
  const foundCoreSkills = extractSkillsFromText(resumeText, roleConfig.core);
  const missingCoreSkills = roleConfig.core.filter(sk => !text.includes(sk.toLowerCase()));
  const foundBonusSkills = extractSkillsFromText(resumeText, roleConfig.bonus);
  const foundAtsKeywords = extractSkillsFromText(resumeText, roleConfig.ats);

  // ── Structure detection ───────────────────────────────────────────────────
  const STRUCTURE_SECTIONS = ['experience', 'education', 'skills', 'projects', 'summary', 'objective', 'certifications', 'achievements'];
  const foundSections = STRUCTURE_SECTIONS.filter(s => text.includes(s));
  const missingSections = ['experience', 'skills', 'projects'].filter(s => !text.includes(s));

  // ── Contact info ──────────────────────────────────────────────────────────
  const hasGithub = !!githubUrl;
  const hasLinkedin = !!linkedinUrl;
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(text);
  const hasPhone = /(\+?\d[\d\s\-().]{7,}\d)/.test(resumeText);

  // ── Impact metrics ────────────────────────────────────────────────────────
  const impactPatterns = [/\d+%/, /\$[\d,]+/, /\d+[kmb]\+?/i, /\d+ (users|clients|team|members|engineers|services|apis)/i];
  const impactCount = impactPatterns.filter(p => p.test(resumeText)).length;
  const hasMetrics = impactCount >= 2;
  const bulletCount = lines.filter(l => /^[-•*▪➤]/.test(l.trim())).length;
  const hasActionVerbs = /developed|built|designed|implemented|created|deployed|optimized|integrated|reduced|improved|increased/i.test(resumeText);
  const hasLeadership = /led|managed|mentored|coordinated|oversaw|supervised/i.test(resumeText);
  const hasExperience = /internship|experience|worked at|employed|company|organization/i.test(resumeText);
  const hasProjects = text.includes('project');
  const hasGithubLinks = /github\.com\//i.test(resumeText);
  const hasLiveLinks = liveUrls.length > 0;
  const hasDegree = /b\.?tech|b\.?e\.?|bachelor|master|m\.?tech|phd|b\.?sc/i.test(resumeText);
  const hasPremiumCollege = /iit|nit|bits|iiit|vit|srm/i.test(resumeText);
  const hasCerts = certifications.length > 0;
  const hasGpa = /gpa|cgpa|percentage|marks/i.test(resumeText);

  // ── Score calculation ─────────────────────────────────────────────────────
  let score = 40;
  score += Math.min(20, Math.round((foundCoreSkills.length / roleConfig.core.length) * 20));
  score += Math.min(5, foundBonusSkills.length);
  score += hasEmail ? 2 : 0;
  score += hasPhone ? 1 : 0;
  score += hasGithub ? 3 : 0;
  score += hasLinkedin ? 2 : 0;
  score += Math.min(5, foundSections.length);
  score += hasMetrics ? 5 : 0;
  score += impactCount >= 4 ? 2 : 0;
  score += hasProjects ? 3 : 0;
  score += hasGithubLinks ? 2 : 0;
  score += hasLiveLinks ? 1 : 0;
  score += hasExperience ? 3 : 0;
  score += hasLeadership ? 2 : 0;
  score += hasDegree ? 3 : 0;
  score += hasPremiumCollege ? 1 : 0;
  score = Math.min(97, Math.max(18, score));

  // ── Evidence-based strengths ──────────────────────────────────────────────
  const strengths = [];

  if (foundCoreSkills.length >= Math.ceil(roleConfig.core.length * 0.5)) {
    const listed = foundCoreSkills.slice(0, 4).join(', ');
    strengths.push(pick([
      `Covers ${foundCoreSkills.length} of ${roleConfig.core.length} core ${targetRole} skills including ${listed} — solid foundational alignment.`,
      `Skills section includes key ${targetRole} technologies: ${listed}. This covers the majority of what recruiters scan for in this role.`,
    ]));
  }

  if (hasMetrics && metricExamples.length > 0) {
    strengths.push(`Uses quantified impact — for example: "${metricExamples[0].slice(0, 90)}". This is exactly what interviewers look for.`);
  }

  if (hasGithub && hasLinkedin) {
    strengths.push(`Both ${githubUrl} and ${linkedinUrl} are linked, giving recruiters immediate access to verify your work and professional profile.`);
  } else if (hasGithub) {
    strengths.push(`${githubUrl} is linked in the resume — this allows reviewers to validate project claims directly.`);
  }

  if (hasProjects && hasGithubLinks && projectNames.length > 0) {
    strengths.push(`Project "${projectNames[0]}" is backed by a GitHub link, which adds credibility and lets interviewers inspect the codebase.`);
  }

  if (degreeInfo && hasPremiumCollege && collegeName) {
    strengths.push(`${degreeInfo} from ${collegeName} adds strong academic credibility for a ${targetRole} position.`);
  } else if (hasDegree && degreeInfo) {
    strengths.push(`${degreeInfo} is a relevant qualification that meets the educational requirement for most ${targetRole} roles.`);
  }

  if (hasExperience && hasActionVerbs && companyNames.length > 0) {
    strengths.push(`Experience at ${companyNames[0]} uses action-driven language, which reads well to both ATS and human reviewers.`);
  }

  if (hasCerts && certifications.length > 0) {
    strengths.push(`Certification/activity listed — "${certifications[0].slice(0, 70)}" adds third-party validation to your skill claims.`);
  }

  if (foundBonusSkills.length >= 2) {
    strengths.push(`Knowledge of ${foundBonusSkills.slice(0, 3).join(', ')} goes beyond baseline requirements and signals a proactive learner.`);
  }

  if (hasLiveLinks) {
    strengths.push(`Live project URL found (${liveUrls[0]}) — deployed projects are significantly more compelling than code-only submissions.`);
  }

  if (hasLeadership) {
    strengths.push(`Leadership language detected — phrases like "led" or "managed" signal ownership, which is valued in ${targetRole} interviews.`);
  }

  if (strengths.length === 0) {
    strengths.push('The document was parsed successfully. However, most standard resume sections are either missing or not clearly labelled.');
  }

  // ── Evidence-based weaknesses ─────────────────────────────────────────────
  const weaknesses = [];

  if (missingCoreSkills.length > 0) {
    const top = missingCoreSkills.slice(0, 3).join(', ');
    weaknesses.push(pick([
      `The resume does not mention ${top} — these are standard requirements for ${targetRole} roles and their absence may trigger ATS rejection.`,
      `Key skills missing for a ${targetRole} role: ${top}. Recruiters often filter resumes using these exact keywords before a human reads them.`,
    ]));
  }

  if (!hasMetrics) {
    if (bulletLines.length > 0) {
      weaknesses.push(`Bullet points like "${bulletLines[0].slice(0, 80)}" describe tasks but not impact. Recruiters want to know the outcome — add numbers, scale, or improvement percentages.`);
    } else {
      weaknesses.push(`No quantifiable metrics found. Every bullet point should answer: how many users, what percentage improvement, what scale of data, or what business outcome.`);
    }
  }

  if (!hasGithub) {
    weaknesses.push(pick([
      `No GitHub link is present. For a ${targetRole} role, showing code publicly is often more convincing than listing skills. Even a profile with 3–4 pinned repos makes a measurable difference.`,
      `GitHub is not linked. Without visible code, claims about ${foundCoreSkills.slice(0, 2).join(' and ')} cannot be verified by a recruiter or technical reviewer.`,
    ]));
  }

  if (!hasLinkedin) {
    weaknesses.push(`LinkedIn is not mentioned. Most recruiters cross-check candidates on LinkedIn before scheduling interviews — missing this link is a missed opportunity.`);
  }

  if (!hasProjects) {
    weaknesses.push(`No projects section found. Without projects, a ${targetRole} resume looks incomplete — especially for candidates with limited work experience.`);
  } else if (!hasGithubLinks && projectNames.length > 0) {
    weaknesses.push(`${projectNames.length > 1 ? `Projects like "${projectNames[0]}" and "${projectNames[1] || projectNames[0]}" are listed` : `"${projectNames[0]}" is listed`} without GitHub links. Interviewers cannot verify the technical depth or code quality without source access.`);
  }

  if (!hasExperience) {
    weaknesses.push(`No internship or work experience is listed. For a ${targetRole} role, even a 1–2 month internship or open-source contribution significantly improves shortlisting chances.`);
  }

  if (!hasCerts && score < 70) {
    weaknesses.push(`No certifications or competitive programming entries are found. For a profile at this experience level, a relevant certification (e.g., ${missingCoreSkills[0] ? missingCoreSkills[0] + '-related' : 'role-specific'} course) helps fill skill gaps credibly.`);
  }

  if (wordCount < 200) {
    weaknesses.push(`The resume is under ${wordCount} words — significantly shorter than the typical 400–600 word range. This suggests key sections are missing or underdeveloped.`);
  }

  if (missingSections.length > 0) {
    weaknesses.push(`Standard sections missing: ${missingSections.join(', ')}. These headers are essential for ATS parsing and human readability.`);
  }

  // ── Improvement roadmap ───────────────────────────────────────────────────
  const roadmap = [];

  if (!hasMetrics) {
    if (bulletLines.length > 0) {
      roadmap.push(`Rewrite bullet points with impact. For example, convert "${bulletLines[0].slice(0, 60)}..." to include a measurable outcome like "...reducing processing time by 35%".`);
    } else {
      roadmap.push(`Every bullet point should follow the pattern: Action → Task → Result. Example: "Developed a REST API using Node.js that reduced data fetch latency by 40%."`);
    }
  }

  if (missingCoreSkills.length > 0) {
    roadmap.push(`Add ${missingCoreSkills.slice(0, 2).join(' and ')} to your skills section or build a small project that uses them to justify listing them.`);
  }

  if (!hasGithub) {
    roadmap.push(`Create a GitHub profile and push all listed projects there. Pin your best 3–4 repos, write README files with screenshots, and link the profile at the top of your resume.`);
  }

  if (!hasLinkedin) {
    roadmap.push(`Create a LinkedIn profile mirroring your resume content. Enable "Open to Work" with ${targetRole} as the target role. Recruiters who find your resume will almost always check LinkedIn next.`);
  }

  if (hasProjects && !hasGithubLinks) {
    const proj = projectNames[0] || 'your main project';
    roadmap.push(`Upload "${proj}" and your other projects to GitHub. Ensure each repo has a descriptive README explaining the problem solved, tech stack used, and how to run it.`);
  }

  if (!hasExperience) {
    roadmap.push(`Apply to internship programs or contribute to open-source projects on GitHub. Even 1–2 months of hands-on experience in a ${targetRole} context can be the deciding factor for shortlisting.`);
  }

  if (hasProjects && !hasLiveLinks) {
    roadmap.push(`Deploy your projects online for free using Vercel, Netlify, or Render, and add live demo URLs. A recruiter who can click and test a live app is far more impressed than one who only sees code.`);
  }

  if (!hasCerts && score < 72) {
    roadmap.push(`Complete a structured certification course related to ${missingCoreSkills[0] || targetRole} on Coursera or Udemy. Add it to a Certifications section with the completion date.`);
  }

  roadmap.push(`Tailor the top third of your resume specifically for ${targetRole} roles — make sure the title, summary, and top skills match what ${targetRole} job descriptions ask for verbatim.`);

  // ── Section-level feedback (evidence-based) ───────────────────────────────

  const structureFeedback = (() => {
    const parts = [];
    if (foundSections.length >= 5) {
      parts.push(`Resume includes ${foundSections.join(', ')} — most key sections are present and labelled.`);
    } else {
      parts.push(`Only ${foundSections.length} of the expected 6–7 resume sections are clearly labelled (found: ${foundSections.join(', ') || 'none'}).`);
    }
    if (bulletCount > 5) {
      parts.push(`Good use of ${bulletCount} bullet points — information is scannable.`);
    } else if (bulletCount > 0) {
      parts.push(`Only ${bulletCount} bullet points detected. Expand each section with 3–4 bullets per role or project.`);
    } else {
      parts.push(`No bullet points found. Use bullets for every experience and project entry so ATS and recruiters can scan them quickly.`);
    }
    if (wordCount > 600) {
      parts.push(`At ${wordCount} words, the resume may be over-length for a single page. Trim older or less relevant entries if under 3 years of experience.`);
    } else if (wordCount < 200) {
      parts.push(`At only ${wordCount} words, the resume is too sparse. Most competitive resumes for ${targetRole} roles are 400–600 words.`);
    } else {
      parts.push(`Word count (${wordCount}) is within a healthy range for a ${targetRole} resume.`);
    }
    return parts.join(' ');
  })();

  const projectFeedback = (() => {
    if (!hasProjects) {
      return `No projects section was found. For a ${targetRole} role${!hasExperience ? ' with no work experience' : ''}, this is a critical gap. Build 2–3 projects using ${foundCoreSkills.slice(0, 2).join(' and ') || 'the core technologies for this role'}, deploy them, and describe what problem each one solves.`;
    }
    const parts = [];
    if (projectNames.length > 0) {
      parts.push(`Projects detected: ${projectNames.slice(0, 3).join(', ')}.`);
      if (!hasGithubLinks) {
        parts.push(`None of these have GitHub links — a recruiter or engineer reviewing the resume has no way to verify the technical quality of ${projectNames[0]}.`);
      }
      if (!hasLiveLinks) {
        parts.push(`No live deployment URLs found. Deploying ${projectNames[0]} on a platform like Vercel or Heroku and adding the link would immediately strengthen this section.`);
      }
    }
    parts.push(`For each project, describe: (1) the problem it solves, (2) the specific technologies used and why, (3) any measurable outcome like users, load time, or accuracy.`);
    return parts.join(' ');
  })();

  const skillsFeedback = (() => {
    const parts = [];
    if (foundCoreSkills.length === 0) {
      parts.push(`None of the standard ${targetRole} core skills were detected. Ensure your skills section explicitly lists technology names rather than generic descriptions.`);
    } else {
      parts.push(`Core skills found: ${foundCoreSkills.join(', ')}.`);
      if (missingCoreSkills.length > 0) {
        parts.push(`Not listed: ${missingCoreSkills.slice(0, 4).join(', ')}. These are commonly required in ${targetRole} job descriptions and should appear if you have any exposure to them.`);
      }
    }
    parts.push(`ATS keyword match: ${foundAtsKeywords.length}/${roleConfig.ats.length} of the critical ${targetRole} ATS keywords are present.`);
    if (foundBonusSkills.length > 0) {
      parts.push(`Bonus skills like ${foundBonusSkills.slice(0, 2).join(' and ')} are present — these differentiate you from candidates with only core skills.`);
    }
    return parts.join(' ');
  })();

  const targetRoleFit = (() => {
    const parts = [];
    if (score >= 75) {
      parts.push(`Overall, this resume is a strong fit for ${targetRole} roles.`);
    } else if (score >= 55) {
      parts.push(`This resume is a partial fit for ${targetRole} — the core skills are there but some gaps reduce competitiveness.`);
    } else {
      parts.push(`This resume currently has significant gaps relative to typical ${targetRole} hiring requirements.`);
    }
    if (foundCoreSkills.length >= Math.ceil(roleConfig.core.length * 0.6)) {
      parts.push(`Technical skill alignment is solid.`);
    } else {
      parts.push(`Technical skill alignment is weak — ${targetRole} hiring managers typically expect familiarity with ${roleConfig.core.slice(0, 3).join(', ')}, and only ${foundCoreSkills.length} of ${roleConfig.core.length} are visible.`);
    }
    if (companyNames.length > 0) {
      parts.push(`Experience at ${companyNames[0]} is directly relevant and strengthens the application.`);
    } else if (!hasExperience) {
      parts.push(`No industry experience is listed, which is a common shortlisting barrier. Practical exposure through internships or freelance work would address this.`);
    }
    return parts.join(' ');
  })();

  const summary = (() => {
    const scoreLabel = score >= 75 ? 'competitive' : score >= 55 ? 'developing' : 'early-stage';
    const keyGap = !hasMetrics ? 'quantified impact is absent' : missingCoreSkills.length > 0 ? `${missingCoreSkills[0]} is not listed` : 'some polish is needed';
    return `${scoreLabel.charAt(0).toUpperCase() + scoreLabel.slice(1)} ${targetRole} resume — ${keyGap}. ${score >= 75 ? 'Ready for applications with targeted improvements.' : score >= 55 ? 'Needs focused improvements before broad applications.' : 'Significant sections need development before applying.'}`;
  })();

  // ── Resume-specific observations ──────────────────────────────────────────
  const observations = [];

  if (projectNames.length > 0 && !hasGithubLinks) {
    observations.push(`"${projectNames[0]}" is listed as a project but has no GitHub link or live URL. A recruiter cannot assess the code quality, project architecture, or whether it was actually completed.`);
  }

  if (hasMetrics && metricExamples.length > 0) {
    observations.push(`Metric detected: "${metricExamples[0].slice(0, 100)}". This is good evidence-based writing — apply the same style to all other bullet points that currently read as task descriptions.`);
  }

  if (collegeName && hasPremiumCollege) {
    observations.push(`${collegeName} is a well-known institution. If you have a CGPA above 8.0, explicitly state it — many companies use CGPA as a filter at the initial screening stage.`);
  }

  if (!hasGpa && hasDegree) {
    observations.push(`CGPA or percentage is not mentioned alongside the degree. Many shortlisting systems (especially campus-placed companies) filter by a minimum CGPA — make it visible if it's above 7.0.`);
  }

  if (companyNames.length > 0 && !hasMetrics) {
    observations.push(`Experience at ${companyNames[0]} is listed but the bullet points read as responsibilities, not accomplishments. For example, instead of describing what your role was, describe what changed because of your work there.`);
  }

  if (certifications.length > 0) {
    observations.push(`Certification listed: "${certifications[0].slice(0, 70)}". Consider adding the issuing organization and date to give this more credibility.`);
  }

  if (foundBonusSkills.includes('docker') || foundBonusSkills.includes('kubernetes')) {
    observations.push(`${foundBonusSkills.filter(s => ['docker', 'kubernetes'].includes(s)).join(' and ')} is listed — this is a differentiator for ${targetRole} candidates. If you have used it in a project, describe the deployment scenario explicitly.`);
  }

  if (hasLinkedin && !hasGithub && targetRole !== 'Product Manager' && targetRole !== 'UI/UX Designer') {
    observations.push(`LinkedIn is linked but GitHub is missing. For a technical ${targetRole} role, GitHub is considered the more critical of the two — a recruiter or engineer will look for code samples before your professional network.`);
  }

  if (wordCount < 250 && hasProjects) {
    observations.push(`Projects section exists but appears to be one-liner descriptions. Each project should have 2–4 bullets covering: what it does, the tech stack, your specific contribution, and any measurable outcome.`);
  }

  if (observations.length === 0) {
    observations.push(`The resume was analyzed successfully. No single section stands out as uniquely strong or problematic — focus on adding metrics and deploying projects to raise the overall score.`);
  }

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
    resume_specific_observations: observations.slice(0, 5),
    generic_feedback_detected: false,
    simple_review: {
      summary: summary,
      strengths: strengths.slice(0, 5).map(s => `Good: ${s}`),
      weaknesses: weaknesses.slice(0, 5).map(w => `Needs Fix: ${w}`),
      improvement_roadmap: roadmap.slice(0, 6).map(r => `Action: ${r}`),
      section_feedback: [
        { section: 'Structure', feedback: structureFeedback },
        { section: 'Projects', feedback: projectFeedback },
        { section: 'Skills', feedback: skillsFeedback },
        { section: 'Role Fit', feedback: targetRoleFit }
      ]
    }
  };
}

module.exports = { analyzeLocally };
