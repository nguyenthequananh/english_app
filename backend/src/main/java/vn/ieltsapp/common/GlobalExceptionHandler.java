package vn.ieltsapp.common;

import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ProblemDetail handleApi(ApiException e) {
        ProblemDetail p = problem(e.getStatus(), e.getCode(), e.getMessage());
        if (!e.getDetails().isEmpty()) {
            p.setProperty("errors", e.getDetails());
        }
        return p;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleInvalid(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return problem(HttpStatus.BAD_REQUEST, "VALIDATION", message);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return problem(HttpStatus.BAD_REQUEST, "VALIDATION", e.getName() + ": giá trị không hợp lệ");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadable(HttpMessageNotReadableException e) {
        return problem(HttpStatus.BAD_REQUEST, "BAD_JSON", "Dữ liệu gửi lên không đúng định dạng");
    }

    /**
     * Lỗi chuẩn của Spring MVC (404, 405, 415, ...) giữ đúng mã HTTP và header (ví dụ Allow);
     * mọi lỗi khác là lỗi không mong muốn: 500 INTERNAL và ghi log ERROR.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception e) {
        if (e instanceof ErrorResponse spring) {
            HttpStatusCode status = spring.getStatusCode();
            HttpStatus known = HttpStatus.resolve(status.value());
            String code = known != null ? known.name() : "HTTP_" + status.value();
            String message = switch (status.value()) {
                case 404 -> "Không tìm thấy đường dẫn";
                case 405 -> "Phương thức không được hỗ trợ";
                default -> spring.getBody().getDetail() != null ? spring.getBody().getDetail() : code;
            };
            return ResponseEntity.status(status).headers(spring.getHeaders()).body(problem(status, code, message));
        }
        log.error("Lỗi không mong muốn", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(problem(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL", "Có lỗi không mong muốn, xem log"));
    }

    static ProblemDetail problem(HttpStatusCode status, String code, String message) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(status, message);
        p.setProperty("code", code);
        return p;
    }
}
