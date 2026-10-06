package vn.ieltsapp.lesson;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ExerciseGraderTest {

    @Test
    void fillIgnoresCaseSpacesAndAcceptsAlternatives() {
        assertThat(ExerciseGrader.isCorrect("FILL", "was written", "  Was   Written ")).isTrue();
        assertThat(ExerciseGrader.isCorrect("FILL", "don't|do not", "do not")).isTrue();
        assertThat(ExerciseGrader.isCorrect("FILL", "don't|do not", "don’t")).isTrue();
        assertThat(ExerciseGrader.isCorrect("FILL", "play", "plays")).isFalse();
        assertThat(ExerciseGrader.isCorrect("FILL", "play", null)).isFalse();
    }

    @Test
    void mcqRequiresExactOption() {
        assertThat(ExerciseGrader.isCorrect("MCQ", "goes", "goes")).isTrue();
        assertThat(ExerciseGrader.isCorrect("MCQ", "goes", "Goes")).isFalse();
    }

    @Test
    void gradeAllScoresAndShowsFirstAlternative() {
        List<ExerciseRow> rows = List.of(
                new ExerciseRow("E1", "MCQ", "p", List.of("a", "b"), "a", "giải thích 1"),
                new ExerciseRow("E2", "FILL", "p", List.of(), "do not|don't", "giải thích 2"));
        GradedAnswers graded = ExerciseGrader.gradeAll(rows, Map.of("E1", "a", "E2", "dont"));
        assertThat(graded.score()).isEqualTo(0.5);
        assertThat(graded.results().get(1).correct()).isFalse();
        assertThat(graded.results().get(1).answer()).isEqualTo("do not");
    }

    @Test
    void emptyExerciseListScoresFull() {
        assertThat(ExerciseGrader.gradeAll(List.of(), Map.of()).score()).isEqualTo(1.0);
    }
}
