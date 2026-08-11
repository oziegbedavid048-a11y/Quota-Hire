document.addEventListener("DOMContentLoaded", function () {
    // Hardcoded job templates matching the frontend PostJob logic
    const jobTemplates = {
    "Property Manager": {
        "keywords": [
            "property manager",
            "real estate manager",
            "residential manager",
            "commercial property"
        ],
        "description": "We are seeking an experienced Property Manager to oversee the daily operations of our real estate portfolio. You will be responsible for tenant relations, lease administration, maintenance coordination, and financial reporting. The ideal candidate ensures properties are well-maintained, occupancy rates are high, and tenant satisfaction is maximized.",
        "requirements": "3+ years of property management experience\nStrong knowledge of local housing and property laws\nExcellent communication and conflict resolution skills\nProficiency in property management software (Yardi, AppFolio, etc.)\nAbility to be on-call for property emergencies"
    },
    "Properties Sales Marketer": {
        "keywords": [
            "properties sales marketer",
            "property sales",
            "real estate marketer",
            "property marketer"
        ],
        "description": "We are looking for a dynamic Properties Sales Marketer to drive our real estate marketing campaigns. You will be responsible for creating compelling property listings, managing digital marketing channels, and generating qualified leads for our sales team. The ideal candidate has a strong understanding of the real estate market and digital marketing trends.",
        "requirements": "2+ years of experience in real estate marketing or sales\nStrong knowledge of digital marketing (SEO, social media, email campaigns)\nExcellent communication and copywriting skills\nAbility to create engaging property listings and promotional materials\nProven track record of generating real estate leads"
    },
    "Real Estate Agent": {
        "keywords": [
            "real estate agent",
            "realtor",
            "real estate broker",
            "property sales"
        ],
        "description": "Join our high-performing real estate team! As a Real Estate Agent, you will represent buyers and sellers in residential and commercial property transactions. You will generate leads, conduct property showings, negotiate contracts, and guide clients through the closing process while delivering exceptional customer service.",
        "requirements": "Active Real Estate License in the state of operation\nProven track record of successful sales or lead generation\nStrong negotiation and interpersonal skills\nEntrepreneurial mindset with self-driven motivation\nFamiliarity with the local real estate market and MLS"
    },
    "Leasing Consultant": {
        "keywords": [
            "leasing consultant",
            "leasing agent",
            "apartment leasing",
            "property leasing"
        ],
        "description": "As a Leasing Consultant, you are the first point of contact for prospective tenants. You will showcase properties, process lease applications, manage renewals, and assist with marketing efforts to maintain maximum occupancy levels. Your goal is to convert prospects into happy residents.",
        "requirements": "1+ years in sales, hospitality, or customer service\nExcellent presentation and persuasive communication skills\nAbility to work weekends and flexible hours\nFamiliarity with leasing software and social media marketing"
    },
    "Facilities Manager": {
        "keywords": [
            "facilities manager",
            "building manager",
            "maintenance manager",
            "facilities director"
        ],
        "description": "The Facilities Manager will oversee the maintenance, security, and operational efficiency of our commercial properties. You will manage vendor relationships, oversee preventative maintenance programs, and ensure compliance with health and safety regulations to provide a safe working environment.",
        "requirements": "5+ years of facilities or building management experience\nStrong knowledge of HVAC, electrical, and plumbing systems\nExperience managing budgets and contractor negotiations\nOSHA certification or strong knowledge of safety compliance"
    },
    "Real Estate Analyst": {
        "keywords": [
            "real estate analyst",
            "property analyst",
            "acquisitions analyst",
            "investment analyst"
        ],
        "description": "We are looking for a highly analytical Real Estate Analyst to support our acquisitions and development team. You will conduct market research, perform financial modeling, evaluate property valuations, and prepare investment memorandums to guide strategic real estate investments.",
        "requirements": "Bachelor's degree in Finance, Real Estate, or Economics\n2+ years of experience in real estate financial modeling\nAdvanced Excel skills (DCF, cash flow projections)\nStrong understanding of cap rates, IRR, and market trends"
    },
    "Sales Development Representative (SDR)": {
        "keywords": [
            "sdr",
            "sales development",
            "business development rep",
            "bdr"
        ],
        "description": "As an SDR, you will be the engine of our pipeline. Your primary responsibility is to identify, research, and engage outbound prospects through multi-channel outreach including cold calls, personalized emails, and LinkedIn. You will qualify inbound leads and schedule meetings for Account Executives, playing a critical role in our revenue growth.",
        "requirements": "0\u20132 years of sales or customer-facing experience\nExcellent verbal and written communication skills\nHigh energy, resilience, and coachability\nFamiliarity with CRM tools (Salesforce, HubSpot, or similar)\nAbility to manage high daily call and email volume"
    },
    "Account Executive": {
        "keywords": [
            "account executive",
            "ae ",
            "ae,",
            "sales executive",
            "closing rep",
            "quota-carrying"
        ],
        "description": "We are seeking a driven Account Executive to manage the full sales cycle from prospecting to close. You will work closely with SDRs to qualify leads, conduct deep-dive discovery calls, run product demonstrations, and negotiate contracts to drive revenue growth in your territory.",
        "requirements": "3+ years of B2B SaaS sales experience\nProven track record of closing five and six-figure deals\nExperience with MEDDIC, BANT, or Challenger methodology\nStrong presentation and negotiation skills\nProficiency with Salesforce and sales engagement tools"
    },
    "Enterprise Account Executive": {
        "keywords": [
            "enterprise account",
            "enterprise ae",
            "enterprise sales",
            "strategic account"
        ],
        "description": "As an Enterprise Account Executive, you will own complex, high-value sales cycles targeting Fortune 500 and mid-market companies. You will build executive-level relationships, navigate multiple stakeholders, and close transformational deals that shape our company's growth trajectory.",
        "requirements": "5+ years of enterprise B2B sales experience\nTrack record of closing $250K+ ARR deals\nExperience selling to C-suite and VP-level buyers\nProficiency with complex deal structuring and procurement\nKnowledge of MEDDIC, Command of the Message, or similar enterprise methodology"
    },
    "Sales Manager": {
        "keywords": [
            "sales manager",
            "head of sales",
            "sales lead",
            "revenue manager"
        ],
        "description": "The Sales Manager will lead, coach, and inspire a team of high-performing Account Executives to exceed revenue targets. You will be responsible for pipeline management, forecasting accuracy, and developing strategies to penetrate new markets.",
        "requirements": "5+ years of sales experience, 2+ in a leadership role\nProven ability to hire, train, and develop top sales talent\nDeep understanding of enterprise sales cycles\nStrong analytical skills and data-driven decision making\nExperience with CRM forecasting and pipeline management"
    },
    "VP of Sales": {
        "keywords": [
            "vp of sales",
            "vice president sales",
            "vp sales",
            "head of revenue",
            "chief revenue officer",
            "cro"
        ],
        "description": "The VP of Sales will define and execute our go-to-market strategy, build and scale a world-class sales organization, and partner with executive leadership to achieve aggressive growth targets. You will be responsible for revenue planning, team structure, and overall sales culture.",
        "requirements": "8+ years of progressive B2B sales experience\n4+ years leading and scaling sales teams\nProven track record of exceeding $10M+ ARR targets\nExperience building sales processes from the ground up\nStrong executive presence and board-level communication skills"
    },
    "Account Manager": {
        "keywords": [
            "account manager",
            "client manager",
            "relationship manager",
            "key account"
        ],
        "description": "The Account Manager will serve as the primary point of contact for our existing client base. Your focus will be on driving product adoption, managing renewals, and identifying up-sell and cross-sell opportunities to maximize account value and retention.",
        "requirements": "3+ years of account management or B2B sales experience\nProven ability to negotiate renewals and up-sells\nStrong relationship-building and consultative skills\nTrack record of meeting or exceeding retention quotas"
    },
    "Customer Success Manager": {
        "keywords": [
            "customer success",
            "csm",
            "client success",
            "customer experience"
        ],
        "description": "As a Customer Success Manager, you will be the primary post-sale relationship owner for a portfolio of strategic accounts. Your goal is to drive product adoption, ensure customer health, identify expansion opportunities, and reduce churn by delivering measurable business value.",
        "requirements": "2+ years in Customer Success, Account Management, or related field\nStrong consultative communication skills\nAbility to understand and articulate complex product value\nExperience with CS platforms (Gainsight, ChurnZero, or Totango)\nData-driven approach to health scoring and QBRs"
    },
    "Sales Operations Manager": {
        "keywords": [
            "sales operations",
            "sales ops",
            "revenue operations",
            "rev ops",
            "revops"
        ],
        "description": "The Sales Operations Manager will partner with sales leadership to optimize process, tooling, and data to accelerate revenue. You will own our CRM architecture, sales analytics, quota planning, and forecasting processes to ensure the team operates at peak efficiency.",
        "requirements": "3+ years in Sales Operations or Revenue Operations\nDeep Salesforce CRM expertise (Admin certification preferred)\nStrong SQL and data visualization skills (Tableau, Looker)\nExperience with territory design and quota modelling\nAbility to translate data insights into actionable recommendations"
    },
    "Business Development Manager": {
        "keywords": [
            "business development",
            "bd manager",
            "partnerships",
            "strategic partnerships",
            "channel sales"
        ],
        "description": "As a Business Development Manager, you will identify, negotiate, and close strategic partnerships that expand our market reach and revenue streams. You will cultivate relationships with potential partners, resellers, and channel sales organizations to create mutually beneficial growth opportunities.",
        "requirements": "4+ years of business development or partnerships experience\nStrong network in the relevant industry vertical\nExperience structuring and closing complex partnership agreements\nExcellent negotiation and relationship management skills\nAbility to work cross-functionally with product, legal, and finance"
    },
    "Software Engineer": {
        "keywords": [
            "software engineer",
            "developer",
            "frontend",
            "backend",
            "full stack",
            "fullstack",
            "react",
            "node",
            "python dev",
            "java dev"
        ],
        "description": "We are looking for a talented Software Engineer to join our growing engineering team. You will design, build, and maintain scalable software solutions, collaborate with product and design to ship high-quality features, and contribute to our engineering culture of excellence.",
        "requirements": "2+ years of professional software development experience\nProficiency in relevant programming languages and frameworks\nStrong understanding of software design principles and patterns\nExperience with version control (Git), CI/CD pipelines\nExcellent problem-solving and communication skills"
    },
    "Senior Software Engineer": {
        "keywords": [
            "senior engineer",
            "senior developer",
            "principal engineer",
            "staff engineer",
            "lead developer"
        ],
        "description": "As a Senior Software Engineer, you will lead the architecture and development of our core systems. You will mentor junior developers, drive technical decisions, establish best practices, and tackle our most complex scaling challenges.",
        "requirements": "5+ years of backend or full-stack software development\nDeep expertise in system architecture and microservices\nExperience leading technical projects from conception to deployment\nStrong understanding of cloud infrastructure (AWS/GCP/Azure)"
    },
    "DevOps Engineer": {
        "keywords": [
            "devops",
            "site reliability",
            "sre",
            "cloud engineer",
            "infrastructure engineer"
        ],
        "description": "We are seeking a DevOps Engineer to design, implement, and maintain our cloud infrastructure and deployment pipelines. You will focus on automation, security, performance monitoring, and ensuring high availability of our production systems.",
        "requirements": "3+ years of DevOps or SRE experience\nExpertise with containerization (Docker, Kubernetes)\nStrong knowledge of IaC tools (Terraform, CloudFormation)\nExperience with CI/CD tools (Jenkins, GitHub Actions, GitLab CI)\nProficiency in scripting languages (Python, Bash)"
    },
    "QA Automation Engineer": {
        "keywords": [
            "qa engineer",
            "quality assurance",
            "sdet",
            "test automation"
        ],
        "description": "As a QA Automation Engineer, you will design and implement automated testing frameworks to ensure the highest quality of our software releases. You will write scripts for end-to-end, API, and integration testing, and integrate them into our CI/CD pipelines.",
        "requirements": "3+ years in software quality assurance and test automation\nProficiency in testing tools (Selenium, Cypress, Playwright)\nExperience testing RESTful APIs and modern web applications\nStrong understanding of agile methodologies"
    },
    "Data Engineer": {
        "keywords": [
            "data engineer",
            "etl developer",
            "big data engineer",
            "data pipeline"
        ],
        "description": "The Data Engineer will build and maintain scalable data pipelines, data warehouses, and analytics infrastructure. You will work closely with Data Scientists and Analysts to ensure data is clean, reliable, and accessible for strategic decision-making.",
        "requirements": "3+ years of Data Engineering experience\nExpertise in SQL, Python, and ETL frameworks\nExperience with cloud data warehouses (Snowflake, BigQuery, Redshift)\nKnowledge of data orchestration tools (Airflow, dbt)"
    },
    "Product Manager": {
        "keywords": [
            "product manager",
            "pm ",
            "product lead",
            "product owner",
            "head of product"
        ],
        "description": "As a Product Manager, you will define and champion the product vision, roadmap, and strategy. Working closely with engineering, design, sales, and customers, you will prioritize features, write clear requirements, and ship products that users love and that drive business growth.",
        "requirements": "3+ years of product management experience in a SaaS environment\nStrong ability to translate customer feedback into product requirements\nExperience with agile development methodologies\nData-driven decision making with strong analytical skills\nExcellent stakeholder communication and roadmap management"
    },
    "Product Designer (UI/UX)": {
        "keywords": [
            "product designer",
            "ui designer",
            "ux designer",
            "ui/ux",
            "user experience"
        ],
        "description": "We are looking for a Product Designer to craft intuitive, beautiful, and user-centric interfaces. You will conduct user research, create wireframes and high-fidelity prototypes, and collaborate with engineers to ensure pixel-perfect implementation.",
        "requirements": "3+ years of UI/UX or Product Design experience\nExpertise in Figma, Sketch, or Adobe XD\nA strong portfolio demonstrating complex problem-solving through design\nUnderstanding of responsive design and accessibility standards"
    },
    "Marketing Manager": {
        "keywords": [
            "marketing manager",
            "head of marketing",
            "digital marketing",
            "growth marketing",
            "demand generation"
        ],
        "description": "The Marketing Manager will own and execute our integrated marketing strategy across digital, content, and events channels. You will generate qualified pipeline for the sales team, build brand awareness, and measure campaign performance to continuously optimize our go-to-market approach.",
        "requirements": "4+ years of B2B marketing experience\nProven ability to drive MQL/SQL pipeline\nExperience with HubSpot, Marketo, or equivalent marketing automation\nStrong copywriting and content strategy skills\nData-driven approach with experience in A/B testing and analytics"
    },
    "SEO Specialist": {
        "keywords": [
            "seo specialist",
            "search engine optimization",
            "seo manager",
            "organic growth"
        ],
        "description": "As an SEO Specialist, you will drive our organic growth strategy. You will conduct keyword research, perform technical SEO audits, optimize on-page content, and execute link-building campaigns to improve our search rankings and drive qualified traffic.",
        "requirements": "2+ years of dedicated SEO experience\nProficiency with SEO tools (Ahrefs, SEMrush, Google Search Console)\nUnderstanding of technical SEO and website architecture\nStrong analytical skills to track and report on rankings"
    },
    "Social Media Manager": {
        "keywords": [
            "social media manager",
            "community manager",
            "social media specialist",
            "content creator"
        ],
        "description": "We are seeking a creative Social Media Manager to grow our brand presence across LinkedIn, Twitter, Instagram, and TikTok. You will create engaging content, manage community interactions, and run social campaigns to build brand loyalty and awareness.",
        "requirements": "2+ years of social media management experience\nExcellent copywriting and visual content creation skills\nDeep understanding of social media algorithms and trends\nExperience with social analytics and scheduling tools"
    },
    "Data Analyst": {
        "keywords": [
            "data analyst",
            "business analyst",
            "data scientist",
            "analytics",
            "bi analyst"
        ],
        "description": "As a Data Analyst, you will transform raw data into actionable insights that drive strategic decision-making. You will build dashboards, analyze performance trends, and partner closely with leadership and revenue teams to identify growth opportunities.",
        "requirements": "2+ years of data analysis experience\nProficiency in SQL and at least one analytics tool (Tableau, Looker, Power BI)\nExperience with Python or R for statistical analysis (a plus)\nStrong ability to present complex data in a clear and compelling way\nMeticulous attention to data quality and accuracy"
    },
    "Operations Manager": {
        "keywords": [
            "operations manager",
            "head of operations",
            "ops manager",
            "chief of staff",
            "coo"
        ],
        "description": "The Operations Manager will streamline our internal processes, manage cross-functional projects, and ensure the business runs smoothly and efficiently. You will partner with every team to remove friction, implement scalable systems, and drive operational excellence.",
        "requirements": "4+ years of operations or project management experience\nStrong process improvement and systems-thinking skills\nExperience managing cross-functional projects and stakeholders\nProficiency with project management tools (Asana, Monday, Notion)\nExcellent organizational and leadership skills"
    },
    "Recruitment Consultant": {
        "keywords": [
            "recruitment",
            "recruiter",
            "talent acquisition",
            "headhunter",
            "staffing"
        ],
        "description": "As a Recruitment Consultant, you will manage the full recruitment lifecycle \u2014 from sourcing and screening candidates to presenting opportunities and managing client relationships. You will build a deep talent network and consistently deliver top-quality hires that exceed client expectations.",
        "requirements": "2+ years of recruitment or talent acquisition experience\nStrong sourcing skills across LinkedIn, job boards, and direct outreach\nExcellent candidate and client relationship management\nAbility to manage multiple requisitions simultaneously\nKnowledge of employment law and best practices"
    },
    "HR Business Partner": {
        "keywords": [
            "hr business partner",
            "hrbp",
            "human resources manager",
            "people ops",
            "people partner"
        ],
        "description": "The HR Business Partner will support our teams in all aspects of the employee lifecycle. You will handle employee relations, performance management, compliance, and organizational culture initiatives to ensure a healthy and productive work environment.",
        "requirements": "5+ years of progressive HR experience\nDeep knowledge of employment laws and compliance regulations\nStrong empathy and conflict resolution skills\nExperience partnering with senior leaders on organizational design"
    },
    "Financial Analyst": {
        "keywords": [
            "financial analyst",
            "fp&a",
            "finance manager",
            "corporate finance"
        ],
        "description": "As a Financial Analyst, you will play a critical role in our FP&A team. You will be responsible for financial forecasting, variance analysis, budgeting, and providing leadership with the financial insights needed to drive company strategy.",
        "requirements": "2+ years of corporate finance or FP&A experience\nAdvanced proficiency in Excel and financial modeling\nStrong understanding of GAAP and financial statements\nAbility to distill complex financial data into executive summaries"
    },
    "Accountant": {
        "keywords": [
            "accountant",
            "staff accountant",
            "bookkeeper",
            "accounting manager"
        ],
        "description": "We are looking for a meticulous Accountant to manage our day-to-day financial operations. You will handle accounts payable/receivable, payroll processing, bank reconciliations, and assist with month-end and year-end close processes.",
        "requirements": "Bachelor's degree in Accounting or Finance\nCPA certification or progress towards it (preferred)\nProficiency in accounting software (QuickBooks, NetSuite, Xero)\nHigh attention to detail and accuracy"
    },
    "Customer Support Representative": {
        "keywords": [
            "customer support",
            "support agent",
            "customer service",
            "helpdesk",
            "csr"
        ],
        "description": "As a Customer Support Representative, you will be the friendly face of our company. You will resolve customer inquiries via email, chat, and phone, troubleshoot technical issues, and ensure every customer has a positive and seamless experience with our platform.",
        "requirements": "1+ years of customer service or support experience\nExcellent written and verbal communication skills\nEmpathetic, patient, and problem-solving mindset\nFamiliarity with helpdesk software (Zendesk, Intercom)"
    }
};
  
    function findMatchingTemplate(title) {
        if (!title || title.trim().length < 3) return null;
        const lower = title.toLowerCase();
        for (const [templateName, data] of Object.entries(jobTemplates)) {
            const allKeywords = [templateName.toLowerCase(), ...data.keywords];
            if (allKeywords.some(kw => lower.includes(kw) || kw.includes(lower))) {
                return templateName;
            }
        }
        return null;
    }
  
    const titleInput = document.getElementById('id_title');
    const descriptionBox = document.getElementById('id_description');
    
    // We check for the new text-based requirements box, falling back to the old JSON one if needed.
    const requirementsBox = document.getElementById('id_requirements_text') || document.getElementById('id_requirements');

    if (!titleInput || !descriptionBox) return; // Not on the Job admin page

    // Create the suggestion banner container
    const suggestionBanner = document.createElement('div');
    suggestionBanner.style.display = 'none';
    suggestionBanner.style.backgroundColor = '#fffbeb';
    suggestionBanner.style.border = '1px solid #fcd34d';
    suggestionBanner.style.padding = '10px 15px';
    suggestionBanner.style.borderRadius = '5px';
    suggestionBanner.style.marginBottom = '15px';
    suggestionBanner.style.color = '#92400e';
    suggestionBanner.style.fontWeight = 'bold';
    suggestionBanner.style.alignItems = 'center';
    suggestionBanner.style.justifyContent = 'space-between';
    suggestionBanner.style.gap = '15px';
    suggestionBanner.style.maxWidth = '800px';

    const bannerText = document.createElement('span');
    suggestionBanner.appendChild(bannerText);

    const applyButton = document.createElement('button');
    applyButton.innerText = '✨ Use Template';
    applyButton.type = 'button';
    applyButton.style.backgroundColor = '#f59e0b';
    applyButton.style.color = 'white';
    applyButton.style.border = 'none';
    applyButton.style.padding = '6px 12px';
    applyButton.style.borderRadius = '4px';
    applyButton.style.cursor = 'pointer';
    applyButton.style.fontWeight = 'bold';
    suggestionBanner.appendChild(applyButton);

    // Insert banner before description box
    const descriptionRow = descriptionBox.closest('.form-row') || descriptionBox.parentNode;
    descriptionRow.parentNode.insertBefore(suggestionBanner, descriptionRow);

    let currentTemplate = null;

    function checkTitle() {
        const title = titleInput.value;
        const match = findMatchingTemplate(title);
        
        if (match) {
            currentTemplate = match;
            bannerText.innerHTML = `Template available: <i>${match}</i>. Click to auto-fill description & requirements.`;
            suggestionBanner.style.display = 'flex';
        } else {
            suggestionBanner.style.display = 'none';
            currentTemplate = null;
        }
    }

    titleInput.addEventListener('input', checkTitle);
    
    // Check initially in case editing an existing job
    checkTitle();

    applyButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentTemplate) {
            const templateData = jobTemplates[currentTemplate];
            
            descriptionBox.value = templateData.description;
            
            if (requirementsBox) {
                if (requirementsBox.id === 'id_requirements_text') {
                    // It's the new plain text area, insert text directly
                    requirementsBox.value = templateData.requirements;
                } else {
                    // Fallback to JSON array for legacy field
                    const reqArray = templateData.requirements.split('\n').filter(r => r.trim() !== '');
                    requirementsBox.value = JSON.stringify(reqArray, null, 2);
                }
            }
  
            // Visual feedback
            const originalText = applyButton.innerText;
            applyButton.innerText = '✅ Applied!';
            applyButton.style.backgroundColor = '#10b981';
            setTimeout(() => {
                applyButton.innerText = originalText;
                applyButton.style.backgroundColor = '#f59e0b';
            }, 2000);
        }
    });
});
