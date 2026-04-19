const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   POST /api/translate
// @desc    Translate text using Sarvam AI
// @access  Private
router.post('/', auth, async (req, res) => {
  const { text, target_language_code } = req.body;

  if (!text || !target_language_code) {
    return res.status(400).json({ error: 'Please provide text and target_language_code' });
  }

  // Sarvam API integration placeholder.
  // In a real scenario, you would make a fetch call to Sarvam's API:
  // const response = await fetch('https://api.sarvam.ai/translate', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'api-subscription-key': process.env.SARVAM_API_KEY
  //   },
  //   body: JSON.stringify({ input: text, source_language_code: 'en-IN', target_language_code })
  // });
  // const data = await response.json();

  try {
    // Mocking the translation response for demonstration
    // Since we don't have the actual API key guaranteed to be set, we mock the result
    const mockedTranslations = {
      'hi-IN': `[Translated to Hindi] ${text}`,
      'bn-IN': `[Translated to Bengali] ${text}`,
      'te-IN': `[Translated to Telugu] ${text}`
    };

    const translatedText = mockedTranslations[target_language_code] || `[Translated to ${target_language_code}] ${text}`;

    res.json({ translated_text: translatedText });
  } catch (error) {
    console.error('Translation Error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

module.exports = router;
