package vn.ieltsapp.content;

import java.util.List;
import org.springframework.http.HttpStatus;
import vn.ieltsapp.common.ApiException;

public class ContentValidationException extends ApiException {
    public ContentValidationException(List<String> errors) {
        super(HttpStatus.BAD_REQUEST, "CONTENT_INVALID", "Nội dung không hợp lệ", errors);
    }
}
