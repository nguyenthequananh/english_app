package vn.ieltsapp.session;

import vn.ieltsapp.vocab.WordDto;

public record SessionView(String studyDate, String step, WordDto currentCard, int reviewsLeft, int newLeft,
                          String lessonCode, int cardsDone, boolean finished) {}
