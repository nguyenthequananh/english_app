package vn.ieltsapp.vocab;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class Sm2Test {
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 5);

    @Test
    void firstGoodReviewSchedulesTomorrow() {
        CardState next = Sm2.schedule(CardState.fresh(TODAY), Grade.GOOD, TODAY);
        assertThat(next.intervalDays()).isEqualTo(1);
        assertThat(next.repetitions()).isEqualTo(1);
        assertThat(next.ease()).isCloseTo(2.5, within(1e-9));
        assertThat(next.dueDate()).isEqualTo(TODAY.plusDays(1));
    }

    @Test
    void secondGoodReviewSchedulesSixDays() {
        CardState s = new CardState(2.5, 1, 1, 0, TODAY);
        CardState next = Sm2.schedule(s, Grade.GOOD, TODAY);
        assertThat(next.intervalDays()).isEqualTo(6);
        assertThat(next.repetitions()).isEqualTo(2);
        assertThat(next.dueDate()).isEqualTo(TODAY.plusDays(6));
    }

    @Test
    void laterReviewsMultiplyByPreviousEase() {
        CardState s = new CardState(2.5, 6, 2, 0, TODAY);
        CardState next = Sm2.schedule(s, Grade.GOOD, TODAY);
        assertThat(next.intervalDays()).isEqualTo(15);
        assertThat(next.repetitions()).isEqualTo(3);
    }

    @Test
    void easyRaisesEaseAndHardLowersIt() {
        assertThat(Sm2.schedule(CardState.fresh(TODAY), Grade.EASY, TODAY).ease()).isCloseTo(2.6, within(1e-9));
        assertThat(Sm2.schedule(CardState.fresh(TODAY), Grade.HARD, TODAY).ease()).isCloseTo(2.36, within(1e-9));
    }

    @Test
    void againResetsRepetitionsAndCountsLapse() {
        CardState s = new CardState(2.5, 15, 3, 0, TODAY);
        CardState next = Sm2.schedule(s, Grade.AGAIN, TODAY);
        assertThat(next.repetitions()).isZero();
        assertThat(next.intervalDays()).isEqualTo(1);
        assertThat(next.lapses()).isEqualTo(1);
        assertThat(next.ease()).isCloseTo(1.96, within(1e-9));
        assertThat(next.dueDate()).isEqualTo(TODAY.plusDays(1));
    }

    @Test
    void easeNeverDropsBelowMinimum() {
        CardState s = new CardState(1.3, 1, 0, 5, TODAY);
        assertThat(Sm2.schedule(s, Grade.AGAIN, TODAY).ease()).isCloseTo(1.3, within(1e-9));
    }
}
