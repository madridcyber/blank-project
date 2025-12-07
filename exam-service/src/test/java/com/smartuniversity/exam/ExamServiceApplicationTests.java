package com.smartuniversity.exam;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ExamServiceApplicationTests {

    @Test
    void contextLoads() {
        // verifies that the Spring context starts successfully
    }
}