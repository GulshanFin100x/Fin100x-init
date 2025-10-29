import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const sectionsData = [
    {
      name: "Budgeting & Spending Discipline",
      startRule: 1,
      endRule: 5,
      rules: [
        {
          number: 1,
          title: "50/30/20 Rule",
          definition:
            "Split income: 50% needs, 30% wants, 20% goals or savings.",
          whyItMatters:
            "Helps you prioritize essentials while balancing lifestyle and savings.",
          howToApply:
            "Track monthly income, categorize expenses, and set fixed auto-debits for savings.",
          example:
            "If you earn ₹60,000, spend ₹30,000 on needs, ₹18,000 on wants, and save ₹12,000.",
          impact:
            "Develops strong financial discipline and reduces overspending.",
        },
        {
          number: 2,
          title: "Track Every Expense",
          definition:
            "Monitor all transactions to understand spending habits and leaks.",
          whyItMatters:
            "Awareness is the first step to controlling unnecessary outflows.",
          howToApply:
            "Use apps like Walnut or Excel sheets to categorize expenses weekly.",
          example:
            "After 2 months of tracking, you may find ₹3,000/month spent on unused subscriptions.",
          impact: "Saves 10–20% of income by avoiding unnoticed spending.",
        },
        {
          number: 3,
          title: "Avoid Lifestyle Inflation",
          definition: "Keep expenses stable even when income increases.",
          whyItMatters:
            "Prevents your savings rate from dropping as you earn more.",
          howToApply:
            "Each time income rises, increase savings percentage instead of upgrading lifestyle.",
          example:
            "If salary rises by ₹10,000, save ₹7,000 and use ₹3,000 for small upgrades.",
          impact: "Boosts long-term wealth and financial independence.",
        },
        {
          number: 4,
          title: "Use Cash for Discretionary Spending",
          definition:
            "Limit card usage for non-essentials by setting weekly cash budgets.",
          whyItMatters:
            "Cash creates a physical awareness of spending and reduces impulse buys.",
          howToApply:
            "Withdraw ₹2,000/week for dining, shopping, etc. Stop when it’s over.",
          example:
            "Switching to cash cut weekend food expenses from ₹5,000 to ₹3,000.",
          impact: "Improves mindfulness and self-control over wants.",
        },
        {
          number: 5,
          title: "Budget Reviews",
          definition:
            "Regularly review and adjust your budget to reflect new goals or costs.",
          whyItMatters:
            "Keeps financial plan realistic and prevents drift from savings targets.",
          howToApply:
            "Review expenses every 3 months and update goals if required.",
          example:
            "Added new SIPs after rent decrease to maintain same expense ratio.",
          impact: "Ensures steady progress toward financial goals.",
        },
      ],
    },
    {
      name: "Savings & Emergency Shield",
      startRule: 6,
      endRule: 10,
      rules: [
        {
          number: 6,
          title: "Build an Emergency Fund",
          definition: "Save 3–6 months of expenses for unforeseen situations.",
          whyItMatters:
            "Prevents financial stress during job loss or medical emergencies.",
          howToApply:
            "Auto-transfer a small fixed sum monthly into a liquid savings account.",
          example:
            "If your monthly expense is ₹40,000, target ₹2.4 lakh in 12 months.",
          impact: "Provides peace of mind and reduces dependence on loans.",
        },
        {
          number: 7,
          title: "Automate Savings",
          definition:
            "Set up automatic transfers to savings or investment accounts.",
          whyItMatters: "Removes human error and ensures consistency.",
          howToApply:
            "Use standing instructions or SIPs on payday to divert savings first.",
          example:
            "Auto SIP of ₹5,000 each month for mutual funds and emergency fund.",
          impact: "Builds disciplined savings without conscious effort.",
        },
        {
          number: 8,
          title: "Separate Savings from Expenses",
          definition: "Maintain different accounts for spending and saving.",
          whyItMatters: "Reduces temptation to use savings for daily expenses.",
          howToApply:
            "Have one salary account and one ‘untouchable’ savings account.",
          example:
            "Moved ₹10,000/month from salary account to fixed deposit account.",
          impact: "Increases control and clarity in personal finance.",
        },
        {
          number: 9,
          title: "High-Interest Savings Tools",
          definition:
            "Use instruments like liquid mutual funds or high-yield savings accounts.",
          whyItMatters: "Ensures idle cash grows while staying accessible.",
          howToApply:
            "Compare yields of liquid mutual funds and choose one with good liquidity.",
          example: "Earned 6.5% instead of 3% by switching to liquid fund.",
          impact: "Boosts returns on short-term savings safely.",
        },
        {
          number: 10,
          title: "Save Before Spending",
          definition: "Follow ‘pay yourself first’ rule before other expenses.",
          whyItMatters: "Prioritizes wealth creation over consumption.",
          howToApply: "Immediately move 20% of income to savings on payday.",
          example: "Set up an auto debit for SIPs every 1st of the month.",
          impact:
            "Ensures consistent saving habit and long-term financial stability.",
        },
      ],
    },
    {
      name: "Investing & Wealth Growth",
      startRule: 11,
      endRule: 15,
      rules: [
        {
          number: 11,
          title: "Start Early",
          definition:
            "Investing early compounds your returns exponentially over time.",
          whyItMatters:
            "The earlier you start, the higher your potential wealth at retirement.",
          howToApply:
            "Begin investing even small amounts in mutual funds or index funds.",
          example:
            "₹5,000 invested monthly at age 25 grows far more than ₹10,000 at 35.",
          impact: "Leverages time to create wealth effortlessly.",
        },
        {
          number: 12,
          title: "Diversify Investments",
          definition: "Don’t put all your money in one asset or sector.",
          whyItMatters: "Reduces risk of loss from market volatility.",
          howToApply:
            "Spread investments across equity, debt, gold, and real estate.",
          example:
            "During 2020 crash, diversified portfolio fell only 5% vs 25% single-stock.",
          impact: "Ensures stable long-term growth and minimizes losses.",
        },
        {
          number: 13,
          title: "Understand Risk vs Reward",
          definition: "Higher returns require accepting higher volatility.",
          whyItMatters:
            "Helps match investment strategy with personal comfort and goals.",
          howToApply:
            "Assess your risk profile using online calculators or advisors.",
          example: "A balanced investor may hold 60% equity and 40% debt.",
          impact: "Prevents panic selling and aligns growth with comfort.",
        },
        {
          number: 14,
          title: "Invest Regularly",
          definition: "Consistency beats timing; invest monthly via SIPs.",
          whyItMatters: "Averages market ups and downs to reduce risk.",
          howToApply:
            "Set SIP dates and stick with them regardless of market fluctuations.",
          example:
            "Investing ₹5,000/month for 10 years grows steadily despite short-term dips.",
          impact: "Builds strong long-term wealth and confidence.",
        },
        {
          number: 15,
          title: "Review and Rebalance",
          definition:
            "Adjust your portfolio yearly to maintain target allocation.",
          whyItMatters:
            "Prevents overexposure to risky assets after market surges.",
          howToApply:
            "Sell overperforming assets and add to underperformers annually.",
          example:
            "Shifted 10% from equity to debt when equity rose above 70%.",
          impact: "Maintains balance and protects gains over time.",
        },
      ],
    },
    {
      name: "Loans & Debt Management",
      startRule: 16,
      endRule: 20,
      rules: [
        {
          number: 16,
          title: "Avoid Bad Debt",
          definition: "Avoid borrowing for depreciating or luxury items.",
          whyItMatters: "Bad debt drains future income for temporary pleasure.",
          howToApply: "Borrow only for assets or emergencies, not for wants.",
          example: "Avoid EMIs for gadgets or vacations.",
          impact: "Keeps your financial obligations minimal and flexible.",
        },
        {
          number: 17,
          title: "Pay High-Interest Debt First",
          definition:
            "Clear credit card or personal loan dues before other loans.",
          whyItMatters: "Reduces compounding interest burden.",
          howToApply:
            "List all debts and prioritize repayment of highest interest ones.",
          example: "Paid off 36% credit card debt before adding to SIPs.",
          impact: "Improves credit score and saves interest.",
        },
        {
          number: 18,
          title: "EMI-to-Income Ratio",
          definition: "Keep EMIs under 40% of your monthly income.",
          whyItMatters: "Ensures you have cash flow for living and savings.",
          howToApply: "If you earn ₹1 lakh, EMIs shouldn’t exceed ₹40,000.",
          example: "Avoided new car loan to keep ratio healthy.",
          impact: "Maintains financial flexibility.",
        },
        {
          number: 19,
          title: "Avoid Loan Overlaps",
          definition:
            "Don’t take multiple loans simultaneously unless essential.",
          whyItMatters: "Multiple EMIs lead to cash flow stress.",
          howToApply: "Plan one major loan at a time.",
          example: "Cleared personal loan before applying for home loan.",
          impact: "Improves loan eligibility and reduces stress.",
        },
        {
          number: 20,
          title: "Check Credit Score Regularly",
          definition: "Monitor credit reports from CIBIL or Experian yearly.",
          whyItMatters:
            "Detects errors and helps maintain good financial standing.",
          howToApply: "Use free CIBIL checks or bank-provided tools.",
          example:
            "Disputed incorrect overdue entry and improved score by 50 points.",
          impact: "Ensures access to better loans and lower interest rates.",
        },
      ],
    },
    {
      name: "Lifestyle & Luxury Balance",
      startRule: 21,
      endRule: 25,
      rules: [
        {
          number: 21,
          title: "Plan Big Purchases",
          definition:
            "Set aside funds in advance for large expenses instead of using credit.",
          whyItMatters: "Avoids debt traps for luxuries.",
          howToApply: "Save monthly for travel, gadgets, or weddings.",
          example:
            "Saved ₹50,000 over 6 months for a trip instead of using EMI.",
          impact: "Enjoy luxuries guilt-free and debt-free.",
        },
        {
          number: 22,
          title: "Value Experiences Over Things",
          definition:
            "Spend on memorable experiences instead of material items.",
          whyItMatters:
            "Experiences create long-term happiness and satisfaction.",
          howToApply:
            "Allocate 10% of your wants budget to experiences yearly.",
          example:
            "Opted for a short vacation instead of buying new shoes monthly.",
          impact: "Boosts happiness and mental well-being.",
        },
        {
          number: 23,
          title: "Avoid Comparison Spending",
          definition: "Don’t base purchases on peers’ lifestyle.",
          whyItMatters: "Comparison leads to debt and dissatisfaction.",
          howToApply:
            "Unfollow social media accounts that trigger impulsive spending.",
          example:
            "Reduced online shopping after unfollowing luxury influencers.",
          impact: "Saves money and promotes self-contentment.",
        },
        {
          number: 24,
          title: "Reward Yourself Wisely",
          definition: "Treat yourself occasionally without breaking goals.",
          whyItMatters: "Sustains motivation while maintaining discipline.",
          howToApply:
            "Plan small indulgences after hitting financial milestones.",
          example: "Bought a smartwatch after saving ₹1 lakh emergency fund.",
          impact: "Balances happiness with financial progress.",
        },
        {
          number: 25,
          title: "Time-Based Luxury Rule",
          definition:
            "Delay luxury purchases by 30 days to confirm genuine need.",
          whyItMatters: "Cools off emotional impulses.",
          howToApply: "Add to wish list and revisit after a month.",
          example:
            "Skipped a ₹20,000 gadget after realizing it wasn’t essential.",
          impact: "Cuts unnecessary spending and builds mindfulness.",
        },
      ],
    },
    {
      name: "Retirement & Future Security",
      startRule: 26,
      endRule: 30,
      rules: [
        {
          number: 26,
          title: "Start Early for Retirement",
          definition: "Invest small amounts early to benefit from compounding.",
          whyItMatters: "Delaying investments reduces total wealth by decades.",
          howToApply:
            "Begin SIPs in NPS or retirement mutual funds in your 20s.",
          example: "Investing ₹3,000/month at 25 equals ₹1.2 crore by 60.",
          impact: "Ensures financial independence post-retirement.",
        },
        {
          number: 27,
          title: "Use Retirement Accounts",
          definition:
            "Invest in EPF, PPF, NPS for tax-free and secure returns.",
          whyItMatters: "Government-backed options ensure stability.",
          howToApply: "Allocate 20–30% of savings to long-term accounts.",
          example:
            "Added ₹10,000/year to PPF for 15 years — received ₹3.2 lakh maturity.",
          impact: "Builds low-risk foundation for retirement.",
        },
        {
          number: 28,
          title: "Health Insurance is Wealth Insurance",
          definition:
            "Buy sufficient health coverage early to protect savings.",
          whyItMatters: "Medical costs can wipe out savings instantly.",
          howToApply: "Opt for ₹10–20 lakh family floater plan in your 20s.",
          example: "Saved ₹8 lakh during surgery via insurance claim.",
          impact: "Prevents debt and safeguards future savings.",
        },
        {
          number: 29,
          title: "Pension Planning",
          definition: "Include pension instruments for post-retirement income.",
          whyItMatters: "Ensures steady income after employment stops.",
          howToApply: "Invest in NPS or annuity plans in your 30s and 40s.",
          example: "Built ₹50 lakh corpus providing ₹30,000/month pension.",
          impact: "Supports comfortable retired life.",
        },
        {
          number: 30,
          title: "Estate Planning",
          definition: "Plan asset transfer with nominations and wills.",
          whyItMatters: "Avoids disputes and ensures legacy preservation.",
          howToApply: "Prepare will and nominate all financial accounts.",
          example: "Created a digital will listing all assets and accounts.",
          impact: "Ensures loved ones’ financial security and peace.",
        },
      ],
    },
    {
      name: "India-Specific Bharat Rules",
      startRule: 31,
      endRule: 35,
      rules: [
        {
          number: 31,
          title: "Leverage Tax-Saving Instruments",
          definition:
            "Use 80C and 80D deductions via PPF, ELSS, NPS, and insurance.",
          whyItMatters: "Reduces tax burden while building wealth.",
          howToApply:
            "Plan investments before financial year end to maximize benefits.",
          example: "Saved ₹15,600 tax by investing ₹1.5L in ELSS.",
          impact: "Boosts net income and long-term growth.",
        },
        {
          number: 32,
          title: "Know Government Schemes",
          definition:
            "Stay aware of beneficial public schemes like PMJJBY, PMSBY, PMAY.",
          whyItMatters:
            "Provides financial security for low-income individuals.",
          howToApply:
            "Register for relevant schemes via banks or government portals.",
          example: "Enrolled in PMJJBY for ₹330/year life cover of ₹2 lakh.",
          impact: "Adds safety net and encourages inclusivity.",
        },
        {
          number: 33,
          title: "Use UPI and Digital Tools",
          definition:
            "Adopt UPI, BHIM, or netbanking for easy and secure payments.",
          whyItMatters:
            "Improves convenience, tracking, and reduces cash dependency.",
          howToApply: "Use UPI for daily payments with budget categories.",
          example: "Tracked monthly spending through UPI app reports.",
          impact: "Simplifies money management and promotes transparency.",
        },
        {
          number: 34,
          title: "Rural Investment Awareness",
          definition:
            "Encourage savings in Kisan Vikas Patra, Post Office schemes, or RD.",
          whyItMatters: "Ensures safe and steady returns in smaller towns.",
          howToApply:
            "Invest in 5-year RD via nearest post office for assured returns.",
          example: "Earned 7% on post office RD with low risk.",
          impact: "Spreads financial literacy and inclusion.",
        },
        {
          number: 35,
          title: "Financial Literacy for All",
          definition:
            "Promote awareness about budgeting, insurance, and saving among peers.",
          whyItMatters: "Improves national financial resilience.",
          howToApply: "Conduct workshops or share tips online.",
          example: "Helped 10 people open NPS and SIP accounts.",
          impact: "Creates a financially empowered community.",
        },
      ],
    },
  ];

  for (const section of sectionsData) {
    await prisma.section.create({
      data: {
        name: section.name,
        startRule: section.startRule,
        endRule: section.endRule,
        rules: {
          create: section.rules,
        },
      },
    });
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
  });
