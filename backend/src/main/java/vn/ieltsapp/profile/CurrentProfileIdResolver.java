package vn.ieltsapp.profile;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import vn.ieltsapp.common.ApiException;

public class CurrentProfileIdResolver implements HandlerMethodArgumentResolver {
    public static final String SESSION_KEY = "profileId";

    private final ProfileRepository profiles;

    public CurrentProfileIdResolver(ProfileRepository profiles) { this.profiles = profiles; }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentProfileId.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mav,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        HttpSession session = request == null ? null : request.getSession(false);
        Object id = session == null ? null : session.getAttribute(SESSION_KEY);
        if (id instanceof Long profileId && profiles.findById(profileId).isPresent()) {
            return profileId;
        }
        if (session != null) {
            session.removeAttribute(SESSION_KEY);
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "PROFILE_REQUIRED", "Chưa chọn hồ sơ");
    }
}
