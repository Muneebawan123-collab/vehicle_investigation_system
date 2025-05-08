/**
 * Natural Language Processing Service
 * 
 * This service provides NLP capabilities for automated report generation,
 * text analysis, and extraction of key information from documents.
 */

const natural = require('natural');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

// Initialize NLP components
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const tfidf = new natural.TfIdf();
const analyzer = new natural.SentimentAnalyzer('English', stemmer, 'afinn');

/**
 * Generate an automated report for a vehicle incident
 * @param {Object} incident - Incident data
 * @param {Object} vehicle - Vehicle data
 * @param {Array} documents - Related documents
 * @returns {Object} - Generated report data
 */
async function generateIncidentReport(incident, vehicle, documents = []) {
  try {
    // Validate input data
    if (!incident || !vehicle) {
      throw new Error('Missing required data for report generation');
    }
    
    // Extract key information
    const reportData = {
      title: `Incident Report: ${incident.type || 'Investigation'} - ${vehicle.make} ${vehicle.model}`,
      referenceNumber: incident.referenceNumber || generateReferenceNumber(),
      date: new Date().toISOString(),
      summary: generateSummary(incident, vehicle),
      sections: [
        {
          title: 'Incident Details',
          content: formatIncidentDetails(incident)
        },
        {
          title: 'Vehicle Information',
          content: formatVehicleInformation(vehicle)
        },
        {
          title: 'Investigation Findings',
          content: generateFindings(incident, vehicle)
        }
      ],
      appendices: generateAppendices(documents)
    };
    
    // Add additional sections based on incident type
    if (incident.injuries && incident.injuries.length > 0) {
      reportData.sections.push({
        title: 'Injury Assessment',
        content: formatInjuryDetails(incident.injuries)
      });
    }
    
    if (incident.witnesses && incident.witnesses.length > 0) {
      reportData.sections.push({
        title: 'Witness Statements',
        content: formatWitnessStatements(incident.witnesses)
      });
    }
    
    // Generate recommendations based on incident data
    reportData.recommendations = generateRecommendations(incident, vehicle);
    
    return reportData;
  } catch (error) {
    logger.error('Error generating incident report', error);
    throw new Error('Report generation failed: ' + error.message);
  }
}

/**
 * Generate a summary of the incident
 * @param {Object} incident - Incident data
 * @param {Object} vehicle - Vehicle data
 * @returns {string} - Generated summary
 */
function generateSummary(incident, vehicle) {
  const date = incident.date ? new Date(incident.date).toLocaleDateString() : 'Unknown Date';
  const location = incident.location ? `at ${incident.location}` : '';
  const incidentType = incident.type || 'incident';
  
  return `On ${date}, a ${incidentType} occurred ${location} involving a ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} with license plate ${vehicle.licensePlate || 'Unknown'}. ` +
    `The vehicle with VIN ${vehicle.vin || 'Unknown'} was ${incident.status || 'reported'} and is currently under investigation. ` +
    `${incident.description || 'No further details are available at this time.'}`;
}

/**
 * Format incident details for the report
 * @param {Object} incident - Incident data
 * @returns {string} - Formatted incident details
 */
function formatIncidentDetails(incident) {
  let details = '';
  
  details += `**Date & Time:** ${incident.date ? new Date(incident.date).toLocaleString() : 'Unknown'}\n\n`;
  details += `**Location:** ${incident.location || 'Unknown'}\n\n`;
  details += `**Type:** ${incident.type || 'Unknown'}\n\n`;
  details += `**Status:** ${incident.status || 'Under Investigation'}\n\n`;
  
  if (incident.description) {
    details += `**Description:**\n${incident.description}\n\n`;
  }
  
  if (incident.reportedBy) {
    details += `**Reported By:** ${incident.reportedBy}\n\n`;
  }
  
  if (incident.investigators && incident.investigators.length > 0) {
    details += `**Investigating Officers:** ${incident.investigators.join(', ')}\n\n`;
  }
  
  if (incident.weather) {
    details += `**Weather Conditions:** ${incident.weather}\n\n`;
  }
  
  return details;
}

/**
 * Format vehicle information for the report
 * @param {Object} vehicle - Vehicle data
 * @returns {string} - Formatted vehicle information
 */
function formatVehicleInformation(vehicle) {
  let info = '';
  
  info += `**Make:** ${vehicle.make || 'Unknown'}\n\n`;
  info += `**Model:** ${vehicle.model || 'Unknown'}\n\n`;
  info += `**Year:** ${vehicle.year || 'Unknown'}\n\n`;
  info += `**VIN:** ${vehicle.vin || 'Unknown'}\n\n`;
  info += `**License Plate:** ${vehicle.licensePlate || 'Unknown'}\n\n`;
  info += `**Color:** ${vehicle.color || 'Unknown'}\n\n`;
  
  if (vehicle.owner) {
    info += `**Registered Owner:** ${vehicle.owner}\n\n`;
  }
  
  if (vehicle.insuranceProvider) {
    info += `**Insurance:** ${vehicle.insuranceProvider}\n\n`;
    
    if (vehicle.insurancePolicy) {
      info += `**Policy Number:** ${vehicle.insurancePolicy}\n\n`;
    }
  }
  
  return info;
}

/**
 * Generate investigation findings section
 * @param {Object} incident - Incident data
 * @param {Object} vehicle - Vehicle data
 * @returns {string} - Generated findings text
 */
function generateFindings(incident, vehicle) {
  // If there are explicit findings in the incident data, use them
  if (incident.findings) {
    return incident.findings;
  }
  
  // Otherwise, generate findings based on available data
  let findings = 'Based on the investigation conducted, the following findings have been established:\n\n';
  
  if (incident.description) {
    // Extract key information from description using NLP
    const tokens = tokenizer.tokenize(incident.description);
    const entities = extractEntities(tokens);
    
    // Add tokenized insights
    if (entities.length > 0) {
      findings += '1. The investigation identified the following key elements: ' + 
        entities.join(', ') + '.\n\n';
    }
    
    // Add sentiment analysis
    const sentiment = analyzer.getSentiment(tokens);
    if (sentiment < -0.5) {
      findings += '2. The incident appears to be severe based on the reported description.\n\n';
    } else if (sentiment < 0) {
      findings += '2. The incident appears to be moderately serious based on the reported description.\n\n';
    } else {
      findings += '2. The incident appears to be minor based on the reported description.\n\n';
    }
  }
  
  // Add vehicle-specific findings
  findings += `3. The vehicle (${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}) was `;
  
  if (incident.vehicleCondition) {
    findings += `found in ${incident.vehicleCondition} condition.\n\n`;
  } else {
    findings += 'examined as part of the investigation.\n\n';
  }
  
  // Add generic closing
  findings += '4. Further details may be pending additional investigation or analysis.\n\n';
  
  return findings;
}

/**
 * Extract named entities from tokenized text
 * @param {Array} tokens - Array of text tokens
 * @returns {Array} - Extracted entities
 */
function extractEntities(tokens) {
  try {
    // Simple entity extraction based on capitalized words
    // In a real system, this would use a proper NER (Named Entity Recognition) model
    const entities = [];
    let inEntity = false;
    let currentEntity = '';
    
    for (const token of tokens) {
      // Check if token starts with capital letter (simple heuristic for names/places)
      if (/^[A-Z]/.test(token) && token.length > 1) {
        if (inEntity) {
          currentEntity += ' ' + token;
        } else {
          inEntity = true;
          currentEntity = token;
        }
      } else {
        if (inEntity) {
          entities.push(currentEntity);
          inEntity = false;
          currentEntity = '';
        }
      }
    }
    
    // Add the last entity if we were in the middle of one
    if (inEntity && currentEntity) {
      entities.push(currentEntity);
    }
    
    return entities;
  } catch (error) {
    logger.error('Error extracting entities', error);
    return [];
  }
}

/**
 * Format injury details for the report
 * @param {Array} injuries - Injury data
 * @returns {string} - Formatted injury details
 */
function formatInjuryDetails(injuries) {
  if (!injuries || injuries.length === 0) {
    return 'No injuries were reported in connection with this incident.';
  }
  
  let details = 'The following injuries were reported:\n\n';
  
  injuries.forEach((injury, index) => {
    details += `**Injury ${index + 1}:**\n`;
    details += `- Person: ${injury.person || 'Unknown'}\n`;
    details += `- Description: ${injury.description || 'Not specified'}\n`;
    details += `- Severity: ${injury.severity || 'Unknown'}\n`;
    details += `- Treatment: ${injury.treatment || 'Not specified'}\n\n`;
  });
  
  return details;
}

/**
 * Format witness statements for the report
 * @param {Array} witnesses - Witness data
 * @returns {string} - Formatted witness statements
 */
function formatWitnessStatements(witnesses) {
  if (!witnesses || witnesses.length === 0) {
    return 'No witness statements were collected for this incident.';
  }
  
  let statements = 'The following witness statements were collected:\n\n';
  
  witnesses.forEach((witness, index) => {
    statements += `**Witness ${index + 1}: ${witness.name || 'Anonymous'}**\n\n`;
    statements += `${witness.statement || 'No statement provided.'}\n\n`;
    
    if (witness.contactInfo) {
      statements += `Contact: ${witness.contactInfo}\n\n`;
    }
  });
  
  return statements;
}

/**
 * Generate appendices for documents
 * @param {Array} documents - Document data
 * @returns {Array} - Formatted appendices
 */
function generateAppendices(documents) {
  if (!documents || documents.length === 0) {
    return [];
  }
  
  return documents.map((doc, index) => {
    return {
      title: `Appendix ${index + 1}: ${doc.title || doc.filename || 'Document'}`,
      content: doc.description || 'No description provided.',
      referenceNumber: doc.referenceNumber || `DOC-${Date.now()}-${index}`,
      type: doc.type || 'Unknown'
    };
  });
}

/**
 * Generate recommendations based on incident data
 * @param {Object} incident - Incident data
 * @param {Object} vehicle - Vehicle data
 * @returns {Array} - Generated recommendations
 */
function generateRecommendations(incident, vehicle) {
  const recommendations = [];
  
  // Generic recommendations based on incident type
  if (incident.type) {
    const type = incident.type.toLowerCase();
    
    if (type.includes('accident') || type.includes('collision')) {
      recommendations.push('Conduct a comprehensive structural inspection of the vehicle before returning it to service.');
      recommendations.push('Review vehicle maintenance records to identify any pre-existing issues that may have contributed to the incident.');
    }
    
    if (type.includes('theft')) {
      recommendations.push('Install anti-theft devices or tracking systems to prevent future incidents.');
      recommendations.push('Update vehicle security systems and review facility security where the vehicle is stored.');
    }
    
    if (type.includes('fire')) {
      recommendations.push('Perform a detailed electrical system inspection to identify any potential fire hazards.');
      recommendations.push('Consider a recall verification for known fire-related issues for this vehicle make and model.');
    }
    
    if (type.includes('flood') || type.includes('water')) {
      recommendations.push('Inspect for water damage to electrical components and engine systems.');
      recommendations.push('Test all electronic systems for proper functionality.');
    }
  }
  
  // Vehicle age-based recommendations
  if (vehicle.year) {
    const year = parseInt(vehicle.year);
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - year;
    
    if (vehicleAge > 10) {
      recommendations.push('Due to the vehicle\'s age, a comprehensive mechanical inspection is recommended.');
      recommendations.push('Verify compliance with current emissions and safety standards given the vehicle\'s age.');
    }
  }
  
  // Add generic recommendations if we have few specific ones
  if (recommendations.length < 2) {
    recommendations.push('Follow up with all involved parties to ensure proper documentation is completed.');
    recommendations.push('Review and update vehicle records in the system based on this incident.');
  }
  
  return recommendations;
}

/**
 * Generate a unique reference number for reports
 * @returns {string} - Generated reference number
 */
function generateReferenceNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RPT-${timestamp.substring(timestamp.length - 6)}-${random}`;
}

/**
 * Extract key information from a document using NLP
 * @param {string} text - Document text content
 * @returns {Object} - Extracted information
 */
function extractDocumentInformation(text) {
  try {
    // Tokenize the text
    const tokens = tokenizer.tokenize(text);
    
    // Perform sentiment analysis
    const sentiment = analyzer.getSentiment(tokens);
    
    // Extract key phrases (simple implementation)
    tfidf.addDocument(text);
    const keyTerms = [];
    tfidf.listTerms(0).slice(0, 10).forEach(item => {
      keyTerms.push(item.term);
    });
    
    // Extract potential entities (names, places, etc.)
    const entities = extractEntities(tokens);
    
    // Extract dates using simple regex pattern
    const dateRegex = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{2,4}|January|February|March|April|May|June|July|August|September|October|November|December \d{1,2},? \d{2,4})\b/gi;
    const dates = [];
    let match;
    while ((match = dateRegex.exec(text)) !== null) {
      dates.push(match[0]);
    }
    
    return {
      keyTerms,
      entities,
      dates,
      sentiment: getSentimentCategory(sentiment),
      wordCount: tokens.length,
      summary: generateTextSummary(text, keyTerms, entities)
    };
  } catch (error) {
    logger.error('Error extracting document information', error);
    return {
      error: 'Failed to extract information from document'
    };
  }
}

/**
 * Generate a summary of text content
 * @param {string} text - Full text content
 * @param {Array} keyTerms - Key terms from the text
 * @param {Array} entities - Extracted entities
 * @returns {string} - Generated summary
 */
function generateTextSummary(text, keyTerms, entities) {
  try {
    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) return 'No summary available.';
    
    // Score sentences based on key terms and entities
    const scoredSentences = sentences.map(sentence => {
      let score = 0;
      
      // Score based on key terms
      keyTerms.forEach(term => {
        if (sentence.toLowerCase().includes(term.toLowerCase())) {
          score += 1;
        }
      });
      
      // Score based on entities
      entities.forEach(entity => {
        if (sentence.includes(entity)) {
          score += 2;
        }
      });
      
      // Prefer sentences at the beginning or end
      const index = sentences.indexOf(sentence);
      if (index === 0 || index === sentences.length - 1) {
        score += 0.5;
      }
      
      return { sentence, score };
    });
    
    // Sort by score and take top sentences
    scoredSentences.sort((a, b) => b.score - a.score);
    const topSentences = scoredSentences.slice(0, 3);
    
    // Sort by original order for readability
    topSentences.sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence));
    
    // Combine into summary
    return topSentences.map(item => item.sentence.trim()).join(' ');
  } catch (error) {
    logger.error('Error generating text summary', error);
    return 'Summary generation failed.';
  }
}

/**
 * Get a sentiment category from a sentiment score
 * @param {number} score - Sentiment score
 * @returns {string} - Sentiment category
 */
function getSentimentCategory(score) {
  if (score <= -0.5) return 'negative';
  if (score >= 0.5) return 'positive';
  return 'neutral';
}

module.exports = {
  generateIncidentReport,
  extractDocumentInformation
}; 