interface Step {
  number: number;
  title: string;
  description: string;
  videoTimestamp?: number;
  warning?: string;
  tips?: string[];
  imageUrl?: string;
}


export function parseStepsFromContent(content: string): Step[] {
  const steps: Step[] = [];
  
  // Match pattern: number. **Title** (timestamp)
  const stepRegex = /(\d+)\.\s*\*\*([^*]+)\*\*\s*(?:\((\d+):(\d+)\))?/g;
  const matches = Array.from(content.matchAll(stepRegex));
  
  matches.forEach((match, index) => {
    const stepNumber = parseInt(match[1]);
    const title = match[2].trim();
    const minutes = match[3] ? parseInt(match[3]) : 0;
    const seconds = match[4] ? parseInt(match[4]) : 0;
    const timestamp = minutes * 60 + seconds;
    
    // Find content between this step and next
    const startIndex = match.index! + match[0].length;
    const nextMatch = matches[index + 1];
    const endIndex = nextMatch ? nextMatch.index! : content.length;
    const stepContent = content.substring(startIndex, endIndex).trim();
    
    // Extract description (first paragraph)
    const lines = stepContent.split('\n').filter(l => l.trim());
    const description = lines[0]?.trim() || '';
    
    // Extract warnings
    const warningMatch = stepContent.match(/⚠️\s*WARNING:\s*([^\n]+)/);
    const warning = warningMatch ? warningMatch[1].trim() : undefined;
    
    // Extract tips
    const tipMatches = Array.from(stepContent.matchAll(/💡\s*TIP:\s*([^\n]+)/g));
    const tips = tipMatches.map(m => m[1].trim()).filter(Boolean);
    
    steps.push({
      number: stepNumber,
      title,
      description,
      videoTimestamp: timestamp > 0 ? timestamp : undefined,
      warning,
      tips: tips.length > 0 ? tips : undefined
    });
  });
  
  return steps;
}
