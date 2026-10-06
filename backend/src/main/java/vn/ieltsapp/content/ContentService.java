package vn.ieltsapp.content;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.content.ContentModel.StageFile;
import vn.ieltsapp.content.ContentModel.UnitFile;

@Service
public class ContentService {
    public record NamedContent(String name, byte[] bytes) {}

    public record ImportResult(String file, boolean ok, List<String> errors) {}

    private record Parsed(NamedContent source, JsonNode node, String error) {
        boolean isStage() { return node != null && node.has("targetBand"); }
    }

    private final ContentImporter importer;
    private final ObjectMapper mapper;

    public ContentService(ContentImporter importer, ObjectMapper mapper) {
        this.importer = importer;
        this.mapper = mapper;
    }

    /** Mỗi file một transaction; file chặng được nạp trước file unit. */
    public List<ImportResult> importFiles(List<NamedContent> files) {
        List<Parsed> parsed = new ArrayList<>(files.stream().map(this::parse).toList());
        parsed.sort(Comparator.comparing((Parsed p) -> !p.isStage()).thenComparing(p -> p.source().name()));

        List<ImportResult> results = new ArrayList<>();
        for (Parsed p : parsed) {
            String name = p.source().name();
            if (p.error() != null) {
                results.add(new ImportResult(name, false, List.of(p.error())));
                continue;
            }
            try {
                if (p.isStage()) {
                    importer.importStage(mapper.treeToValue(p.node(), StageFile.class));
                } else {
                    importer.importUnit(mapper.treeToValue(p.node(), UnitFile.class));
                }
                results.add(new ImportResult(name, true, List.of()));
            } catch (ApiException e) {
                results.add(new ImportResult(name, false,
                        e.getDetails().isEmpty() ? List.of(e.getMessage()) : e.getDetails()));
            } catch (JsonProcessingException e) {
                results.add(new ImportResult(name, false, List.of("Sai cấu trúc: " + e.getOriginalMessage())));
            }
        }
        return results;
    }

    private Parsed parse(NamedContent file) {
        try {
            JsonNode node = mapper.readTree(file.bytes());
            if (node == null || !node.isObject()) {
                return new Parsed(file, null, "JSON không hợp lệ: không phải một đối tượng JSON");
            }
            return new Parsed(file, node, null);
        } catch (IOException e) {
            return new Parsed(file, null, "JSON không hợp lệ: " + e.getMessage());
        }
    }
}
