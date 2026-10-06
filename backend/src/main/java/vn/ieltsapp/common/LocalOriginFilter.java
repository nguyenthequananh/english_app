package vn.ieltsapp.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Chặn DNS rebinding và POST giả mạo từ trang web khác: /api/** chỉ nhận Host là 127.0.0.1/localhost,
 * và request thay đổi dữ liệu có Origin thì Origin cũng phải là 127.0.0.1/localhost (cổng nào cũng được).
 */
@Component
public class LocalOriginFilter extends OncePerRequestFilter {
    private static final Set<String> LOCAL_HOSTS = Set.of("127.0.0.1", "localhost");
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    private final ObjectMapper mapper;

    public LocalOriginFilter(ObjectMapper mapper) { this.mapper = mapper; }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return !(path.equals("/api") || path.startsWith("/api/"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!isLocal(request.getServerName())) {
            reject(response, "Truy cập bị từ chối: địa chỉ máy chủ không phải máy này");
            return;
        }
        String origin = request.getHeader(HttpHeaders.ORIGIN);
        if (origin != null && !SAFE_METHODS.contains(request.getMethod()) && !isLocal(originHost(origin))) {
            reject(response, "Truy cập bị từ chối: yêu cầu đến từ trang web khác");
            return;
        }
        chain.doFilter(request, response);
    }

    private static String originHost(String origin) {
        try {
            return URI.create(origin.trim()).getHost();
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static boolean isLocal(String host) {
        return host != null && LOCAL_HOSTS.contains(host.toLowerCase(Locale.ROOT));
    }

    private void reject(HttpServletResponse response, String detail) throws IOException {
        ProblemDetail p = GlobalExceptionHandler.problem(HttpStatus.FORBIDDEN, "FORBIDDEN_ORIGIN", detail);
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        mapper.writeValue(response.getOutputStream(), p);
    }
}
