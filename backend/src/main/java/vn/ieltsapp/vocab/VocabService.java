package vn.ieltsapp.vocab;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.common.WordCode;

@Service
public class VocabService {
    private final VocabRepository repo;
    private final Clock clock;

    public VocabService(VocabRepository repo, Clock clock) {
        this.repo = repo;
        this.clock = clock;
    }

    @Transactional
    public CardState review(long profileId, long wordId, Grade grade) {
        findWord(profileId, wordId);
        LocalDate today = LocalDate.now(clock);
        CardState previous = repo.findCard(profileId, wordId).orElse(CardState.fresh(today));
        CardState next = Sm2.schedule(previous, grade, today);
        String now = LocalDateTime.now(clock).toString();
        repo.saveCard(profileId, wordId, next, now);
        repo.logReview(profileId, wordId, grade, previous.intervalDays(), next.intervalDays(), now);
        return next;
    }

    public WordDto findWord(long profileId, long wordId) {
        return repo.findWord(profileId, wordId).orElseThrow(() -> ApiException.notFound("từ"));
    }

    public List<WordDto> words(List<Long> ids) { return repo.findWords(ids); }

    public List<Long> dueWordIds(long profileId, LocalDate day, int limit) {
        return repo.dueWordIds(profileId, day, limit);
    }

    public int countDue(long profileId, LocalDate day) { return repo.countDue(profileId, day); }

    public List<Long> unlearnedWordIds(long profileId, String unitCode, int limit) {
        return repo.unlearnedWordIds(profileId, unitCode, limit);
    }

    public List<WordDto> dueCards(long profileId, int limit) {
        return words(dueWordIds(profileId, LocalDate.now(clock), limit));
    }

    public List<WordBankItem> search(long profileId, String q, WordStatus status) {
        String like = q == null || q.isBlank() ? null : "%" + q.trim() + "%";
        return repo.search(profileId, like, status == null ? null : status.name());
    }

    @Transactional
    public WordDto addUserWord(long profileId, AddWordRequest r) {
        String code = WordCode.of(r.headword(), r.pos());
        if (repo.wordCodeVisible(profileId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "WORD_EXISTS", "Từ này đã có trong kho");
        }
        return findWord(profileId, repo.insertUserWord(profileId, code, r));
    }
}
