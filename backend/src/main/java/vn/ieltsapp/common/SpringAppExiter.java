package vn.ieltsapp.common;

import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class SpringAppExiter implements AppExiter {
    private final ApplicationContext context;

    public SpringAppExiter(ApplicationContext context) { this.context = context; }

    @Override
    public void exit() {
        int code = SpringApplication.exit(context, () -> 0);
        System.exit(code);
    }
}
