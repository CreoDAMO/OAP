use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use regex::Regex;
use unicode_segmentation::UnicodeSegmentation;
use sha2::{Sha256, Digest};
use base64::{Engine as _, engine::general_purpose};
use std::collections::HashMap;

// Console logging macro for debugging
macro_rules! console_log {
    ($($t:tt)*) => (web_sys::console::log_1(&format!($($t)*).into()));
}

#[derive(Serialize, Deserialize)]
pub struct TextAnalysisResult {
    pub word_count: usize,
    pub character_count: usize,
    pub paragraph_count: usize,
    pub sentence_count: usize,
    pub readability_score: f64,
    pub complexity_metrics: ComplexityMetrics,
    pub style_metrics: StyleMetrics,
    pub content_hash: String,
}

#[derive(Serialize, Deserialize)]
pub struct ComplexityMetrics {
    pub avg_words_per_sentence: f64,
    pub avg_syllables_per_word: f64,
    pub fog_index: f64,
    pub flesch_reading_ease: f64,
    pub unique_word_ratio: f64,
}

#[derive(Serialize, Deserialize)]
pub struct StyleMetrics {
    pub passive_voice_ratio: f64,
    pub adverb_ratio: f64,
    pub dialogue_ratio: f64,
    pub action_ratio: f64,
    pub description_ratio: f64,
}

#[derive(Serialize, Deserialize)]
pub struct OptimizationSuggestion {
    pub suggestion_type: String,
    pub priority: String,
    pub message: String,
    pub start_pos: usize,
    pub end_pos: usize,
    pub suggested_replacement: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct CollaborationConflict {
    pub conflict_id: String,
    pub conflict_type: String,
    pub start_pos: usize,
    pub end_pos: usize,
    pub user_a_change: String,
    pub user_b_change: String,
    pub timestamp: String,
    pub resolution_suggestion: String,
}

#[wasm_bindgen]
pub struct TextProcessor {
    word_patterns: Regex,
    sentence_patterns: Regex,
    paragraph_patterns: Regex,
    passive_voice_patterns: Regex,
    adverb_patterns: Regex,
    dialogue_patterns: Regex,
}

#[wasm_bindgen]
impl TextProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> TextProcessor {
        console_log!("Initializing Rust Text Processing Engine");
        
        TextProcessor {
            word_patterns: Regex::new(r"\b\w+\b").unwrap(),
            sentence_patterns: Regex::new(r"[.!?]+").unwrap(),
            paragraph_patterns: Regex::new(r"\n\s*\n").unwrap(),
            passive_voice_patterns: Regex::new(r"\b(was|were|been|being)\s+\w+ed\b").unwrap(),
            adverb_patterns: Regex::new(r"\b\w+ly\b").unwrap(),
            dialogue_patterns: Regex::new(r#""[^"]*""#).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub fn analyze_text(&self, text: &str) -> JsValue {
        let result = self.perform_analysis(text);
        serde_wasm_bindgen::to_value(&result).unwrap()
    }

    #[wasm_bindgen]
    pub fn optimize_text(&self, text: &str) -> JsValue {
        let suggestions = self.generate_optimization_suggestions(text);
        serde_wasm_bindgen::to_value(&suggestions).unwrap()
    }

    #[wasm_bindgen]
    pub fn resolve_conflicts(&self, conflicts_js: &JsValue) -> JsValue {
        let conflicts: Vec<CollaborationConflict> = serde_wasm_bindgen::from_value(conflicts_js.clone()).unwrap();
        let resolved = self.auto_resolve_conflicts(conflicts);
        serde_wasm_bindgen::to_value(&resolved).unwrap()
    }

    #[wasm_bindgen]
    pub fn generate_content_hash(&self, text: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(text.as_bytes());
        let result = hasher.finalize();
        general_purpose::STANDARD.encode(result)
    }
}

impl TextProcessor {
    fn perform_analysis(&self, text: &str) -> TextAnalysisResult {
        console_log!("Performing text analysis on {} characters", text.len());
        
        let words: Vec<&str> = self.word_patterns.find_iter(text).map(|m| m.as_str()).collect();
        let sentences: Vec<&str> = text.split(&self.sentence_patterns).filter(|s| !s.trim().is_empty()).collect();
        let paragraphs: Vec<&str> = self.paragraph_patterns.split(text).filter(|p| !p.trim().is_empty()).collect();

        let word_count = words.len();
        let character_count = text.chars().count();
        let sentence_count = sentences.len();
        let paragraph_count = paragraphs.len();

        // Calculate complexity metrics
        let avg_words_per_sentence = if sentence_count > 0 { word_count as f64 / sentence_count as f64 } else { 0.0 };
        let avg_syllables_per_word = self.calculate_avg_syllables(&words);
        let unique_words: std::collections::HashSet<_> = words.iter().map(|w| w.to_lowercase()).collect();
        let unique_word_ratio = if word_count > 0 { unique_words.len() as f64 / word_count as f64 } else { 0.0 };

        // Flesch Reading Ease
        let flesch_reading_ease = 206.835 - 1.015 * avg_words_per_sentence - 84.6 * avg_syllables_per_word;
        
        // Fog Index
        let complex_words = words.iter().filter(|w| self.count_syllables(w) >= 3).count();
        let fog_index = 0.4 * (avg_words_per_sentence + 100.0 * (complex_words as f64 / word_count as f64));

        // Style metrics
        let passive_voice_matches = self.passive_voice_patterns.find_iter(text).count();
        let passive_voice_ratio = if sentence_count > 0 { passive_voice_matches as f64 / sentence_count as f64 } else { 0.0 };
        
        let adverb_matches = self.adverb_patterns.find_iter(text).count();
        let adverb_ratio = if word_count > 0 { adverb_matches as f64 / word_count as f64 } else { 0.0 };
        
        let dialogue_matches = self.dialogue_patterns.find_iter(text).count();
        let dialogue_ratio = if paragraph_count > 0 { dialogue_matches as f64 / paragraph_count as f64 } else { 0.0 };

        // Generate content hash
        let content_hash = self.generate_content_hash(text);

        TextAnalysisResult {
            word_count,
            character_count,
            paragraph_count,
            sentence_count,
            readability_score: flesch_reading_ease,
            complexity_metrics: ComplexityMetrics {
                avg_words_per_sentence,
                avg_syllables_per_word,
                fog_index,
                flesch_reading_ease,
                unique_word_ratio,
            },
            style_metrics: StyleMetrics {
                passive_voice_ratio,
                adverb_ratio,
                dialogue_ratio,
                action_ratio: 0.0, // Would need more sophisticated analysis
                description_ratio: 0.0, // Would need more sophisticated analysis
            },
            content_hash,
        }
    }

    fn generate_optimization_suggestions(&self, text: &str) -> Vec<OptimizationSuggestion> {
        let mut suggestions = Vec::new();
        
        // Find overly long sentences
        for (i, sentence) in text.split('.').enumerate() {
            let word_count = self.word_patterns.find_iter(sentence).count();
            if word_count > 25 {
                suggestions.push(OptimizationSuggestion {
                    suggestion_type: "sentence_length".to_string(),
                    priority: "medium".to_string(),
                    message: "Consider breaking this long sentence into shorter ones for better readability.".to_string(),
                    start_pos: i * 50, // Approximate position
                    end_pos: (i + 1) * 50,
                    suggested_replacement: None,
                });
            }
        }

        // Find passive voice usage
        for mat in self.passive_voice_patterns.find_iter(text) {
            suggestions.push(OptimizationSuggestion {
                suggestion_type: "passive_voice".to_string(),
                priority: "low".to_string(),
                message: "Consider using active voice for more engaging writing.".to_string(),
                start_pos: mat.start(),
                end_pos: mat.end(),
                suggested_replacement: None,
            });
        }

        // Find adverb overuse
        for mat in self.adverb_patterns.find_iter(text) {
            suggestions.push(OptimizationSuggestion {
                suggestion_type: "adverb_usage".to_string(),
                priority: "low".to_string(),
                message: "Consider using stronger verbs instead of adverbs.".to_string(),
                start_pos: mat.start(),
                end_pos: mat.end(),
                suggested_replacement: None,
            });
        }

        suggestions
    }

    fn auto_resolve_conflicts(&self, conflicts: Vec<CollaborationConflict>) -> Vec<CollaborationConflict> {
        let mut resolved_conflicts = Vec::new();
        
        for mut conflict in conflicts {
            // Simple conflict resolution algorithm
            match conflict.conflict_type.as_str() {
                "text_insertion" => {
                    // Merge both insertions with proper spacing
                    conflict.resolution_suggestion = format!("{} {}", conflict.user_a_change, conflict.user_b_change);
                },
                "text_deletion" => {
                    // Keep the shorter deletion (less destructive)
                    if conflict.user_a_change.len() < conflict.user_b_change.len() {
                        conflict.resolution_suggestion = conflict.user_a_change.clone();
                    } else {
                        conflict.resolution_suggestion = conflict.user_b_change.clone();
                    }
                },
                "text_modification" => {
                    // Use timestamp to determine which change to keep
                    conflict.resolution_suggestion = conflict.user_b_change.clone(); // Most recent
                },
                _ => {
                    conflict.resolution_suggestion = "Manual resolution required".to_string();
                }
            }
            
            resolved_conflicts.push(conflict);
        }
        
        resolved_conflicts
    }

    fn count_syllables(&self, word: &str) -> usize {
        let vowels = "aeiouyAEIOUY";
        let mut syllable_count = 0;
        let mut prev_was_vowel = false;
        
        for ch in word.chars() {
            let is_vowel = vowels.contains(ch);
            if is_vowel && !prev_was_vowel {
                syllable_count += 1;
            }
            prev_was_vowel = is_vowel;
        }
        
        // Handle silent 'e' at the end
        if word.ends_with('e') && syllable_count > 1 {
            syllable_count -= 1;
        }
        
        std::cmp::max(syllable_count, 1)
    }

    fn calculate_avg_syllables(&self, words: &[&str]) -> f64 {
        if words.is_empty() {
            return 0.0;
        }
        
        let total_syllables: usize = words.iter().map(|w| self.count_syllables(w)).sum();
        total_syllables as f64 / words.len() as f64
    }
}

// Export the main functions
#[wasm_bindgen(start)]
pub fn main() {
    console_log!("OmniAuthor Rust Engine initialized successfully!");
}