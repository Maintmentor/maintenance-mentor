import { AIAnalysisResult, PartSource } from './aiVisionService';

interface RepairPattern {
  keywords: string[];
  category: string;
  diagnosis: string;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  estimatedCost: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tools: string[];
  safetyWarnings?: string[];
  partsSources?: PartSource[];
}


const REPAIR_PATTERNS: RepairPattern[] = [
  {
    keywords: ['leak', 'water', 'drip', 'wet', 'moisture'],
    category: 'plumbing',
    diagnosis: 'Potential water leak detected',
    severity: 'high',
    recommendations: [
      'Turn off water supply immediately',
      'Locate the source of the leak',
      'Check pipe joints and connections',
      'Apply temporary sealant if minor',
      'Contact plumber for major leaks'
    ],
    estimatedCost: '$50-300',
    difficulty: 'medium',
    tools: ['Pipe wrench', 'Plumber\'s tape', 'Sealant'],
    safetyWarnings: ['Turn off electricity near water', 'Wear protective gloves'],
    partsSources: [
      {
        part: 'Pipe Sealant Tape (Teflon Tape)',
        retailers: ['HD Supply', 'Home Depot', 'Lowe\'s', 'Amazon'],
        estimatedPrice: '$3-8',
        partNumber: 'HD-PST-100',
        notes: 'White or yellow tape for gas lines'
      },
      {
        part: 'Pipe Joint Compound',
        retailers: ['HD Supply', 'Home Depot', 'Plumbing Supply Co.'],
        estimatedPrice: '$5-12',
        partNumber: 'HD-PJC-500',
        notes: 'Use with threaded connections'
      },
      {
        part: 'Compression Fitting Kit',
        retailers: ['HD Supply', 'Ferguson', 'Lowe\'s'],
        estimatedPrice: '$15-35',
        partNumber: 'HD-CFK-075',
        notes: 'Various sizes available'
      }
    ]
  },

  {
    keywords: ['electrical', 'wire', 'outlet', 'switch', 'spark'],
    category: 'electrical',
    diagnosis: 'Electrical system issue identified',
    severity: 'high',
    recommendations: [
      'Turn off power at circuit breaker',
      'Do not touch exposed wires',
      'Check for loose connections',
      'Test with multimeter',
      'Contact licensed electrician'
    ],
    estimatedCost: '$100-500',
    difficulty: 'hard',
    tools: ['Multimeter', 'Wire strippers', 'Electrical tape'],
    safetyWarnings: ['Never work on live circuits', 'Use proper PPE', 'Consult professional'],
    partsSources: [
      {
        part: 'Wire Connectors (Wire Nuts)',
        retailers: ['HD Supply', 'Home Depot', 'Lowe\'s', 'Grainger'],
        estimatedPrice: '$5-15',
        partNumber: 'HD-WC-AST',
        notes: 'Assorted sizes for different wire gauges'
      },
      {
        part: 'Electrical Outlet (GFCI)',
        retailers: ['HD Supply', 'Home Depot', 'Electrical Supply Co.'],
        estimatedPrice: '$12-25',
        partNumber: 'HD-GFCI-15A',
        notes: 'Required in wet locations'
      },
      {
        part: 'Circuit Breaker',
        retailers: ['HD Supply', 'Ferguson', 'Grainger'],
        estimatedPrice: '$8-45',
        partNumber: 'HD-CB-20A',
        notes: 'Match your panel brand and amperage'
      }
    ]
  },

  {
    keywords: ['crack', 'hole', 'damage', 'broken', 'chip'],
    category: 'structural',
    diagnosis: 'Surface damage or structural issue',
    severity: 'medium',
    recommendations: [
      'Clean the damaged area',
      'Assess the extent of damage',
      'Apply appropriate filler or patch',
      'Sand smooth when dry',
      'Prime and paint if needed'
    ],
    estimatedCost: '$20-150',
    difficulty: 'easy',
    tools: ['Sandpaper', 'Filler/putty', 'Paint brush', 'Primer'],
    partsSources: [
      {
        part: 'Drywall Patch Kit',
        retailers: ['HD Supply', 'Home Depot', 'Lowe\'s', 'Ace Hardware'],
        estimatedPrice: '$8-20',
        partNumber: 'HD-DPK-6X6',
        notes: 'Includes mesh patch and compound'
      },
      {
        part: 'Joint Compound',
        retailers: ['HD Supply', 'Home Depot', 'Lowe\'s'],
        estimatedPrice: '$12-25',
        partNumber: 'HD-JC-GAL',
        notes: 'All-purpose or lightweight formula'
      },
      {
        part: 'Primer/Sealer',
        retailers: ['HD Supply', 'Sherwin-Williams', 'Home Depot'],
        estimatedPrice: '$15-35',
        partNumber: 'HD-PS-QT',
        notes: 'Use before painting patched areas'
      }
    ]
  }
];


const DEFAULT_ANALYSIS: AIAnalysisResult = {
  diagnosis: 'General maintenance item detected',
  severity: 'medium',
  recommendations: [
    'Inspect the item carefully for visible damage',
    'Clean the area thoroughly',
    'Check for loose parts or connections',
    'Apply appropriate maintenance as needed',
    'Monitor for changes over time'
  ],
  estimatedCost: '$25-100',
  difficulty: 'easy',
  tools: ['Basic hand tools', 'Cleaning supplies', 'Flashlight'],
  safetyWarnings: ['Wear appropriate safety equipment', 'Work in well-lit area'],
  partsSources: [
    {
      part: 'General Maintenance Kit',
      retailers: ['HD Supply', 'Home Depot', 'Lowe\'s', 'Amazon'],
      estimatedPrice: '$20-50',
      partNumber: 'HD-GMK-100',
      notes: 'Includes common fasteners and supplies'
    },
    {
      part: 'Multi-Purpose Lubricant',
      retailers: ['HD Supply', 'Home Depot', 'Grainger'],
      estimatedPrice: '$5-12',
      partNumber: 'HD-MPL-16OZ',
      notes: 'WD-40 or similar product'
    }
  ]
};


export const analyzeFallback = async (imageFile?: File): Promise<AIAnalysisResult> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let analysis = { ...DEFAULT_ANALYSIS };
  
  // Analyze filename for clues
  if (imageFile?.name) {
    const filename = imageFile.name.toLowerCase();
    
    for (const pattern of REPAIR_PATTERNS) {
      if (pattern.keywords.some(keyword => filename.includes(keyword))) {
        analysis = {
          diagnosis: pattern.diagnosis,
          severity: pattern.severity,
          recommendations: pattern.recommendations,
          estimatedCost: pattern.estimatedCost,
          difficulty: pattern.difficulty,
          tools: pattern.tools,
          safetyWarnings: pattern.safetyWarnings,
          partsSources: pattern.partsSources
        };
        break;
      }
    }
  }
  
  // Add offline indicator to diagnosis
  analysis.diagnosis = `[Offline Analysis] ${analysis.diagnosis}`;
  
  return analysis;
};



export const getRepairSuggestionsByCategory = (category: string): AIAnalysisResult => {
  const pattern = REPAIR_PATTERNS.find(p => p.category === category);
  if (pattern) {
    return {
      diagnosis: pattern.diagnosis,
      severity: pattern.severity,
      recommendations: pattern.recommendations,
      estimatedCost: pattern.estimatedCost,
      difficulty: pattern.difficulty,
      tools: pattern.tools,
      safetyWarnings: pattern.safetyWarnings,
      partsSources: pattern.partsSources
    };
  }
  return DEFAULT_ANALYSIS;
};