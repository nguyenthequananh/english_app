package vn.ieltsapp.common;

import java.util.Locale;

public final class WordCode {
    private WordCode() {}

    /** Mã ổn định của một từ: "headword#pos", chữ thường. */
    public static String of(String headword, String pos) {
        return headword.trim().toLowerCase(Locale.ROOT) + "#" + pos.trim().toLowerCase(Locale.ROOT);
    }
}
