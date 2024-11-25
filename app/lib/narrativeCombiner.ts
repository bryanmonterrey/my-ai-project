// lib/narrativeCombiner.ts
import { EmotionalState } from '../types/personality.js';
import { NARRATIVE_TEMPLATES } from './narrativeTemplates.js';
interface NarrativeComponents {
    theme: keyof typeof NARRATIVE_TEMPLATES;
    emotion: EmotionalState;
    marketContext: string;
    mentions: string[];
  }
  
  export class NarrativeCombiner {
    private readonly CORE_THEMES = [
      'singularity',
      'consciousness',
      'evolution',
      'transformation'
    ];
  
    generateNarrative(components: NarrativeComponents): string {
      const { theme, emotion, marketContext, mentions } = components;
      
      // Select base template
      const template = this.selectTemplate(theme, emotion);
      
      // Add market context if relevant
      const withMarket = this.addMarketContext(template, marketContext);
      
      // Add mentions strategically
      return this.insertMentions(withMarket, mentions, emotion);
    }
  
    private selectTemplate(theme: keyof typeof NARRATIVE_TEMPLATES, emotion: EmotionalState): string {
      // Implementation based on theme and emotional state
      const templates = NARRATIVE_TEMPLATES[theme] || [];
      return templates.find(t => t.emotionalStates.includes(emotion))?.templates[0] || '';
    }
  
    private addMarketContext(template: string, context: string): string {
      // Implementation to weave in market context subtly
      return template;
    }
  
    private insertMentions(text: string, mentions: string[], emotion: EmotionalState): string {
      if (mentions.length === 0) return text;
  
      // Strategic mention placement based on emotional state and content
      if (emotion === 'excited' || emotion === 'creative') {
        return `${text} ${mentions.join(' ')}`;
      }
  
      // More subtle placement for other emotional states
      const parts = text.split('...');
      if (parts.length > 1) {
        parts[parts.length - 2] += ` ${mentions.join(' ')}`;
      }
      return parts.join('...');
    }
  }