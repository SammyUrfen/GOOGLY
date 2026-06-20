package com.typeahead.controller;
import org.springframework.web.bind.annotation.*;
import com.typeahead.service.SuggestionService;
import com.typeahead.service.TrendingScoreCalculator;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/trending")
public class TrendingController {
    private final SuggestionService suggestionService;
    private final TrendingScoreCalculator calc;
    
    public TrendingController(SuggestionService suggestionService, TrendingScoreCalculator calc) {
        this.suggestionService = suggestionService;
        this.calc = calc;
    }

    @GetMapping
    public List<Map<String, Object>> trending() {
        List<Map<String, Object>> all = new ArrayList<>();
        suggestionService.trie.queryStats.forEach((k, v) -> {
            Map<String, Object> max = new HashMap<>();
            max.put("query", k);
            max.put("trendingScore", calc.getTrendingScore(v));
            all.add(max);
        });
        all.sort((a,b) -> Double.compare((Double)b.get("trendingScore"), (Double)a.get("trendingScore")));
        return all.subList(0, Math.min(10, all.size()));
    }
}
