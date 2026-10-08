package vn.ieltsapp.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * index.html (gồm "/" và mọi đường dẫn React Router được chuyển tiếp tới nó) luôn gửi
 * {@code Cache-Control: no-cache} để trình duyệt hỏi lại server sau khi nâng cấp app,
 * tránh giữ index.html cũ trỏ tới file /assets đã bị thay tên (trang trắng).
 */
@Component
public class SpaCacheFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !isIndexHtmlPath(request.getRequestURI().substring(request.getContextPath().length()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-cache");
        chain.doFilter(request, response);
    }

    static boolean isIndexHtmlPath(String path) {
        if (path.isEmpty() || path.equals("/") || path.equals("/index.html")) return true;
        String rest = path.startsWith("/") ? path.substring(1) : path;
        int slash = rest.indexOf('/');
        String first = slash < 0 ? rest : rest.substring(0, slash);
        return !first.equals("api") && !first.equals("assets") && !first.contains(".");
    }
}
