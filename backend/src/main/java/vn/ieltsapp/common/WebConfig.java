package vn.ieltsapp.common;

import java.util.List;
import java.util.concurrent.TimeUnit;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import vn.ieltsapp.profile.CurrentProfileIdResolver;
import vn.ieltsapp.profile.ProfileRepository;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final ProfileRepository profiles;

    public WebConfig(ProfileRepository profiles) { this.profiles = profiles; }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new CurrentProfileIdResolver(profiles));
    }

    /** File trong /assets có mã băm trong tên (Vite) nên cho trình duyệt giữ lâu; các file tĩnh khác giữ mặc định. */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable());
    }
}
