package vn.ieltsapp.backup;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class BackupFilesTest {
    @TempDir Path dir;

    @Test
    void collisionSuffixSortsNewerFirstAndPruneKeepsIt() throws Exception {
        Files.writeString(dir.resolve("ielts-20261005-090000-manual.db"), "a");
        Files.writeString(dir.resolve("ielts-20261005-090000-manual-2.db"), "b");

        assertThat(BackupFiles.list(dir)).extracting(p -> p.getFileName().toString())
                .containsExactly("ielts-20261005-090000-manual-2.db", "ielts-20261005-090000-manual.db");

        BackupFiles.prune(dir, 1);
        assertThat(BackupFiles.list(dir)).extracting(p -> p.getFileName().toString())
                .containsExactly("ielts-20261005-090000-manual-2.db");
    }
}
