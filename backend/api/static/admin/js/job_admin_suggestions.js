document.addEventListener("DOMContentLoaded", function () {
    // Hardcoded job templates matching the frontend PostJob logic
    const jobTemplates = {
      'Sales Development Representative (SDR)': {
        keywords: ['sdr', 'sales development', 'business development rep', 'bdr'],
        description: "As an SDR, you will be the engine of our pipeline. Your primary responsibility is to identify, research, and engage outbound prospects through multi-channel outreach including cold calls, personalized emails, and LinkedIn. You will qualify inbound leads and schedule meetings for Account Executives, playing a critical role in our revenue growth.",
        requirements: "0–2 years of sales or customer-facing experience\nExcellent verbal and written communication skills\nHigh energy, resilience, and coachability\nFamiliarity with CRM tools (Salesforce, HubSpot, or similar)\nAbility to manage high daily call and email volume"
      },
      'Account Executive': {
        keywords: ['account executive', 'ae ', 'ae,', 'sales executive', 'closing rep', 'quota-carrying'],
        description: "We are seeking a driven Account Executive to manage the full sales cycle from prospecting to close. You will work closely with SDRs to qualify leads, conduct deep-dive discovery calls, run product demonstrations, and negotiate contracts to drive revenue growth in your territory.",
        requirements: "3+ years of B2B SaaS sales experience\nProven track record of closing five and six-figure deals\nExperience with MEDDIC, BANT, or Challenger methodology\nStrong presentation and negotiation skills\nProficiency with Salesforce and sales engagement tools"
      },
      'Sales Manager': {
        keywords: ['sales manager', 'head of sales', 'sales lead', 'revenue manager'],
        description: "The Sales Manager will lead, coach, and inspire a team of high-performing Account Executives to exceed revenue targets. You will be responsible for pipeline management, forecasting accuracy, and developing strategies to penetrate new markets.",
        requirements: "5+ years of sales experience, 2+ in a leadership role\nProven ability to hire, train, and develop top sales talent\nDeep understanding of enterprise sales cycles\nStrong analytical skills and data-driven decision making\nExperience with CRM forecasting and pipeline management"
      },
      'Sales Associate': {
        keywords: ['sales associate', 'junior sales', 'entry level sales', 'sales rep', 'inside sales'],
        description: "As a Sales Associate, you will be the first point of contact for our potential customers. You will be responsible for identifying new business opportunities, engaging with prospects, and demonstrating the value of our products. This role requires high energy, resilience, and a passion for building relationships.",
        requirements: "1+ years of sales experience (B2B preferred)\nExcellent verbal and written communication skills\nGoal-oriented mindset with a track record of meeting quotas\nProficiency with CRM software (Salesforce, HubSpot)"
      },
      'Enterprise Account Executive': {
        keywords: ['enterprise account', 'enterprise ae', 'enterprise sales', 'strategic account'],
        description: "As an Enterprise Account Executive, you will own complex, high-value sales cycles targeting Fortune 500 and mid-market companies. You will build executive-level relationships, navigate multiple stakeholders, and close transformational deals that shape our company's growth trajectory.",
        requirements: "5+ years of enterprise B2B sales experience\nTrack record of closing $250K+ ARR deals\nExperience selling to C-suite and VP-level buyers\nProficiency with complex deal structuring and procurement\nKnowledge of MEDDIC, Command of the Message, or similar enterprise methodology"
      },
      'VP of Sales': {
        keywords: ['vp of sales', 'vice president sales', 'vp sales', 'head of revenue'],
        description: "The VP of Sales will define and execute our go-to-market strategy, build and scale a world-class sales organization, and partner with executive leadership to achieve aggressive growth targets. You will be responsible for revenue planning, team structure, and overall sales culture.",
        requirements: "8+ years of progressive B2B sales experience\n4+ years leading and scaling sales teams\nProven track record of exceeding $10M+ ARR targets\nExperience building sales processes from the ground up\nStrong executive presence and board-level communication skills"
      },
      'Customer Success Manager': {
        keywords: ['customer success', 'csm', 'client success', 'account manager'],
        description: "As a Customer Success Manager, you will be the primary post-sale relationship owner for a portfolio of strategic accounts. Your goal is to drive product adoption, ensure customer health, identify expansion opportunities, and reduce churn by delivering measurable business value.",
        requirements: "2+ years in Customer Success, Account Management, or related field\nStrong consultative communication skills\nAbility to understand and articulate complex product value\nExperience with CS platforms (Gainsight, ChurnZero, or Totango)\nData-driven approach to health scoring and QBRs"
      },
      'Sales Operations Manager': {
        keywords: ['sales operations', 'sales ops', 'revenue operations', 'rev ops', 'revops'],
        description: "The Sales Operations Manager will partner with sales leadership to optimize process, tooling, and data to accelerate revenue. You will own our CRM architecture, sales analytics, quota planning, and forecasting processes to ensure the team operates at peak efficiency.",
        requirements: "3+ years in Sales Operations or Revenue Operations\nDeep Salesforce CRM expertise (Admin certification preferred)\nStrong SQL and data visualization skills (Tableau, Looker)\nExperience with territory design and quota modelling\nAbility to translate data insights into actionable recommendations"
      },
      'Marketing Manager': {
        keywords: ['marketing manager', 'head of marketing', 'digital marketing', 'growth marketing', 'demand generation'],
        description: "The Marketing Manager will own and execute our integrated marketing strategy across digital, content, and events channels. You will generate qualified pipeline for the sales team, build brand awareness, and measure campaign performance to continuously optimize our go-to-market approach.",
        requirements: "4+ years of B2B marketing experience\nProven ability to drive MQL/SQL pipeline\nExperience with HubSpot, Marketo, or equivalent marketing automation\nStrong copywriting and content strategy skills\nData-driven approach with experience in A/B testing and analytics"
      },
      'Business Development Manager': {
        keywords: ['business development', 'bd manager', 'partnerships', 'strategic partnerships', 'channel sales'],
        description: "As a Business Development Manager, you will identify, negotiate, and close strategic partnerships that expand our market reach and revenue streams. You will cultivate relationships with potential partners, resellers, and channel sales organizations to create mutually beneficial growth opportunities.",
        requirements: "4+ years of business development or partnerships experience\nStrong network in the relevant industry vertical\nExperience structuring and closing complex partnership agreements\nExcellent negotiation and relationship management skills\nAbility to work cross-functionally with product, legal, and finance"
      },
      'Territory Sales Representative': {
        keywords: ['territory sales', 'field sales', 'regional sales', 'outside sales', 'field rep'],
        description: "As a Territory Sales Representative, you will own your region and grow revenue by building strong relationships with new and existing customers through in-person meetings, product demonstrations, and events. This is a field-based role requiring regular travel within your assigned territory.",
        requirements: "2+ years of outside or field sales experience\nStrong hunter mentality with ability to manage a geographic territory\nAbility to travel up to 50% of the time\nExcellent in-person presentation and closing skills\nProficiency in CRM and mobile sales tools"
      },
      'Recruitment Consultant': {
        keywords: ['recruitment', 'recruiter', 'talent acquisition', 'headhunter', 'staffing'],
        description: "As a Recruitment Consultant, you will manage the full recruitment lifecycle — from sourcing and screening candidates to presenting opportunities and managing client relationships. You will build a deep talent network and consistently deliver top-quality hires that exceed client expectations.",
        requirements: "2+ years of recruitment or talent acquisition experience\nStrong sourcing skills across LinkedIn, job boards, and direct outreach\nExcellent candidate and client relationship management\nAbility to manage multiple requisitions simultaneously\nKnowledge of employment law and best practices"
      },
      'Product Manager': {
        keywords: ['product manager', 'pm ', 'product lead', 'product owner', 'head of product'],
        description: "As a Product Manager, you will define and champion the product vision, roadmap, and strategy. Working closely with engineering, design, sales, and customers, you will prioritize features, write clear requirements, and ship products that users love and that drive business growth.",
        requirements: "3+ years of product management experience in a SaaS environment\nStrong ability to translate customer feedback into product requirements\nExperience with agile development methodologies\nData-driven decision making with strong analytical skills\nExcellent stakeholder communication and roadmap management"
      },
      'Software Engineer': {
        keywords: ['software engineer', 'developer', 'frontend', 'backend', 'full stack', 'fullstack', 'react', 'node', 'python dev', 'java dev'],
        description: "We are looking for a talented Software Engineer to join our growing engineering team. You will design, build, and maintain scalable software solutions, collaborate with product and design to ship high-quality features, and contribute to our engineering culture of excellence.",
        requirements: "2+ years of professional software development experience\nProficiency in relevant programming languages and frameworks\nStrong understanding of software design principles and patterns\nExperience with version control (Git), CI/CD pipelines\nExcellent problem-solving and communication skills"
      },
      'Data Analyst': {
        keywords: ['data analyst', 'business analyst', 'data scientist', 'analytics', 'bi analyst', 'data engineer'],
        description: "As a Data Analyst, you will transform raw data into actionable insights that drive strategic decision-making. You will build dashboards, analyze performance trends, and partner closely with leadership and revenue teams to identify growth opportunities.",
        requirements: "2+ years of data analysis experience\nProficiency in SQL and at least one analytics tool (Tableau, Looker, Power BI)\nExperience with Python or R for statistical analysis (a plus)\nStrong ability to present complex data in a clear and compelling way\nMeticulous attention to data quality and accuracy"
      },
      'Operations Manager': {
        keywords: ['operations manager', 'head of operations', 'ops manager', 'chief of staff', 'coo'],
        description: "The Operations Manager will streamline our internal processes, manage cross-functional projects, and ensure the business runs smoothly and efficiently. You will partner with every team to remove friction, implement scalable systems, and drive operational excellence.",
        requirements: "4+ years of operations or project management experience\nStrong process improvement and systems-thinking skills\nExperience managing cross-functional projects and stakeholders\nProficiency with project management tools (Asana, Monday, Notion)\nExcellent organizational and leadership skills"
      },
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
    const requirementsBox = document.getElementById('id_requirements');
  
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
            
            // Format requirements into JSON string array as expected by the JSONField
            // Or if requirements is a standard JSONField string editor
            // Let's check how it's handled. The frontend stores array of strings.
            // In Django Admin, a JSONField usually expects valid JSON format (like `["req 1", "req 2"]`)
            const reqArray = templateData.requirements.split('\n').filter(r => r.trim() !== '');
            const reqJson = JSON.stringify(reqArray, null, 2);
  
            descriptionBox.value = templateData.description;
            
            if (requirementsBox) {
                // Determine if requirementsBox is a raw textarea or some widget
                requirementsBox.value = reqJson;
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
