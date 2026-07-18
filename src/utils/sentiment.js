const natural = require('natural');
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer('English', stemmer, 'afinn');
const tokenizer = new natural.WordTokenizer();

const analyzeSentiment = (text) => {
  if (!text) return { score: 0, label: 'NEUTRAL' };
  
  const tokens = tokenizer.tokenize(text);
  const score = analyzer.getSentiment(tokens);
  
  let label = 'NEUTRAL';
  if (score > 0.2) label = 'POSITIVE';
  else if (score < -0.2) label = 'NEGATIVE';
  
  return { score, label };
};

module.exports = { analyzeSentiment };
