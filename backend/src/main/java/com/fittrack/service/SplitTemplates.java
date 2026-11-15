package com.fittrack.service;

import com.fittrack.exception.BusinessException;
import java.util.List;
import org.springframework.http.HttpStatus;

/** Modelos de divisao de treino com exercicios sugeridos da biblioteca inicial. */
final class SplitTemplates {

    record Day(String letter, String name, List<String> exerciseSlugs, int sets, int reps, int rest) { }

    private SplitTemplates() { }

    static List<Day> forType(String type) {
        return switch (type) {
            case "ABC" -> List.of(
                    new Day("A", "Peito e Tríceps", List.of("supino-reto-barra", "supino-inclinado-halteres", "crucifixo-halteres", "crossover", "triceps-corda", "triceps-frances"), 4, 10, 90),
                    new Day("B", "Costas e Bíceps", List.of("puxada-frontal", "remada-curvada-barra", "remada-baixa", "pulldown-braco-estendido", "rosca-direta-barra", "rosca-martelo"), 4, 10, 90),
                    new Day("C", "Pernas e Ombros", List.of("agachamento-livre", "leg-press", "cadeira-extensora", "mesa-flexora", "desenvolvimento-halteres", "elevacao-lateral", "panturrilha-em-pe"), 4, 10, 90));
            case "ABCD" -> List.of(
                    new Day("A", "Peito e Tríceps", List.of("supino-reto-barra", "supino-inclinado-halteres", "crossover", "triceps-corda", "triceps-testa"), 4, 10, 90),
                    new Day("B", "Costas e Bíceps", List.of("puxada-frontal", "remada-curvada-barra", "remada-unilateral", "rosca-direta-barra", "rosca-alternada"), 4, 10, 90),
                    new Day("C", "Pernas", List.of("agachamento-livre", "leg-press", "cadeira-extensora", "stiff", "mesa-flexora", "panturrilha-em-pe"), 4, 10, 120),
                    new Day("D", "Ombros e Abdômen", List.of("desenvolvimento-halteres", "elevacao-lateral", "crucifixo-invertido", "encolhimento", "abdominal-cabo", "prancha"), 3, 12, 60));
            case "ABCDE" -> List.of(
                    new Day("A", "Peito", List.of("supino-reto-barra", "supino-inclinado-halteres", "supino-declinado", "crucifixo-halteres", "crossover"), 4, 10, 90),
                    new Day("B", "Costas", List.of("puxada-frontal", "remada-curvada-barra", "remada-baixa", "remada-unilateral", "pulldown-braco-estendido"), 4, 10, 90),
                    new Day("C", "Pernas", List.of("agachamento-livre", "leg-press", "cadeira-extensora", "mesa-flexora", "elevacao-pelvica", "panturrilha-em-pe"), 4, 10, 120),
                    new Day("D", "Ombros", List.of("desenvolvimento-halteres", "elevacao-lateral", "elevacao-frontal", "face-pull", "encolhimento"), 4, 12, 60),
                    new Day("E", "Braços e Abdômen", List.of("rosca-direta-barra", "rosca-martelo", "triceps-corda", "triceps-frances", "rosca-punho", "abdominal-supra"), 3, 12, 60));
            default -> throw new BusinessException(HttpStatus.BAD_REQUEST, "Divisão inválida");
        };
    }
}
