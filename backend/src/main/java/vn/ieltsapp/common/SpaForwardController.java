package vn.ieltsapp.common;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Đường dẫn của React Router (không phải /api, /assets, không phải file) trả về index.html. */
@Controller
public class SpaForwardController {

    @GetMapping({"/{first:^(?!api$|assets$)[^\\.]*}", "/{first:^(?!api$|assets$)[^\\.]*}/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
