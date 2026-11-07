package com.meokgo.server.domain.food.service;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class FoodDictionary {

    private final String version;
    private final Map<String, String> aliases = new LinkedHashMap<>();
    private final Map<String, Set<String>> descendants = new LinkedHashMap<>();
    private final Pattern aliasPattern;

    public FoodDictionary() throws IOException {
        Properties properties = new Properties();
        try (InputStreamReader reader = new InputStreamReader(
                new ClassPathResource("food-dictionary.properties").getInputStream(), StandardCharsets.UTF_8)) {
            properties.load(reader);
        }
        version = properties.getProperty("version");
        properties.stringPropertyNames().stream().sorted().forEach(key -> {
            if (key.startsWith("aliases.")) {
                String keyword = key.substring("aliases.".length());
                aliases.put(normalize(keyword), keyword);
                Arrays.stream(properties.getProperty(key).split("\\|"))
                        .forEach(alias -> aliases.put(normalize(alias), keyword));
            }
            if (key.startsWith("children.")) {
                descendants.put(key.substring("children.".length()),
                        new LinkedHashSet<>(List.of(properties.getProperty(key).split("\\|"))));
            }
        });
        String alternatives = aliases.keySet().stream()
                .sorted((left, right) -> Integer.compare(right.length(), left.length()))
                .map(Pattern::quote)
                .reduce((left, right) -> left + "|" + right).orElseThrow();
        aliasPattern = Pattern.compile(alternatives);
    }

    public static String normalize(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT)
                .replaceAll("[\\p{Zs}\\t\\r]+", " ").trim();
    }

    public String version() {
        return version;
    }

    public Pattern aliasPattern() {
        return aliasPattern;
    }

    public String canonical(String alias) {
        return aliases.get(alias);
    }

    public Set<String> expand(Collection<String> keywords) {
        Set<String> expanded = new LinkedHashSet<>();
        keywords.forEach(keyword -> expand(keyword, expanded));
        return expanded;
    }

    private void expand(String keyword, Set<String> expanded) {
        if (expanded.add(keyword)) {
            descendants.getOrDefault(keyword, Set.of()).forEach(child -> expand(child, expanded));
        }
    }
}
