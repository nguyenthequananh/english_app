package vn.ieltsapp.session;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.session")
public record PlannerSettings(int maxReviews, int newWords, int skipNewWhenDueOver) {}
