package vn.ieltsapp.common;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
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
}
