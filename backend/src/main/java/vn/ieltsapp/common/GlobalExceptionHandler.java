package vn.ieltsapp.common;

import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

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

    static ProblemDetail problem(HttpStatusCode status, String code, String message) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(status, message);
        p.setProperty("code", code);
        return p;
    }
}
