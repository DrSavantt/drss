export interface HelpGuideEntry {
  title: string;
  whereToFind: string[];
  howToExtract: string[];
  goodExample: string;
  weakExample: string;
  quickTip: string;
}

export const helpGuide: Record<string, HelpGuideEntry> = {
  q1: {
    title: "Who is your IDEAL customer?",
    whereToFind: [
      "Your CRM → Filter by highest lifetime value",
      "Accounting software → Who paid on time",
      "Inbox → Easiest clients to work with"
    ],
    howToExtract: [
      "Pull top 10 customers by revenue",
      "Circle 3-4 you'd want 100 more of",
      "What do they have in common?"
    ],
    goodExample: "Service-based business owners making $1M-$10M annually who struggle with inconsistent lead flow and are willing to invest $3K-5K/month in marketing.",
    weakExample: "Small business owners who need marketing help.",
    quickTip: "If you can't name 3 specific people in this avatar, you don't know them well enough."
  },
  q2: {
    title: "Which criteria does your ideal customer meet?",
    whereToFind: [
      "Market research reports",
      "Industry growth data",
      "Your sales records"
    ],
    howToExtract: [
      "Check if market is growing (Google Trends)",
      "Verify they can afford premium pricing",
      "Confirm you can target them specifically"
    ],
    goodExample: "Select 'All four of the above' - your avatar must meet ALL criteria",
    weakExample: "Selecting only 1-2 criteria - this leads to bad targeting",
    quickTip: "If they don't meet all four, you need a different avatar."
  },
  q3: {
    title: "Demographics of your ideal customer",
    whereToFind: [
      "CRM data",
      "Customer surveys",
      "Facebook Audience Insights"
    ],
    howToExtract: [
      "List age range, location, gender, income level"
    ],
    goodExample: "Male, 38-52 years old, suburban US, household income $150K-$300K",
    weakExample: "Business owners",
    quickTip: "Be specific enough that you could walk into a room and identify them."
  },
  q4: {
    title: "Psychographics of your ideal customer",
    whereToFind: [
      "Customer interviews",
      "Reviews/testimonials",
      "Social media"
    ],
    howToExtract: [
      "What do they value?",
      "What do they fear?",
      "What drives decisions?"
    ],
    goodExample: "Values control and freedom, fears failure and looking incompetent",
    weakExample: "They want to grow their business",
    quickTip: "Psychographics are WHY they buy, demographics are WHO buys."
  },
  q5: {
    title: "Where does your ideal customer spend time?",
    whereToFind: [
      "SparkToro.com",
      "Customer surveys",
      "Social listening tools"
    ],
    howToExtract: [
      "Which platforms?",
      "Which podcasts?",
      "Which communities?"
    ],
    goodExample: "LinkedIn daily, listens to 'My First Million' podcast, attends local BNI meetings",
    weakExample: "Social media",
    quickTip: "You need to be where they already are - can't create new behavior."
  }
};
