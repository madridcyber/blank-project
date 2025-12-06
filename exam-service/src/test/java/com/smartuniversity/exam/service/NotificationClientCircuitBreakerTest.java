package com.smartuniversity.exam.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
class NotificationClientCircuitBreakerTest {

    @Autowired
    private NotificationClient notificationClient;

    @MockBean
    private RestTemplate restTemplate;

    @Test
    void notifyExamStartedShouldFallbackOnFailure() {
        when(restTemplate.exchange(anyString(), any(), any(), eq(Void.class)))
                .thenThrow(new ResourceAccessException("Notification service unavailable"));

        assertDoesNotThrow(() ->
                notificationClient.notifyExamStarted("engineering", UUID.randomUUID()));
    }
}