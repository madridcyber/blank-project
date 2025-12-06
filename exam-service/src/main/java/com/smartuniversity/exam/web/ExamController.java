package com.smartuniversity.exam.web;

import com.smartuniversity.exam.service.ExamService;
import com.smartuniversity.exam.web.dto.CreateExamRequest;
import com.smartuniversity.exam.web.dto.ExamDto;
import com.smartuniversity.exam.web.dto.SubmitExamRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST API for managing exams and submissions.
 */
@RestController
@RequestMapping("/exam")
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    @PostMapping("/exams")
    public ResponseEntity<ExamDto> createExam(@Valid @RequestBody CreateExamRequest request,
                                              @RequestHeader("X-User-Id") String userIdHeader,
                                              @RequestHeader("X-User-Role") String role,
                                              @RequestHeader("X-Tenant-Id") String tenantId) {

        if (!StringUtils.hasText(userIdHeader) || !StringUtils.hasText(role)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID creatorId = UUID.fromString(userIdHeader);
        ExamDto exam = examService.createExam(request, creatorId, tenantId, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(exam);
    }

    @PostMapping("/exams/{id}/start")
    public ResponseEntity<ExamDto> startExam(@PathVariable("id") UUID examId,
                                             @RequestHeader("X-User-Id") String userIdHeader,
                                             @RequestHeader("X-User-Role") String role,
                                             @RequestHeader("X-Tenant-Id") String tenantId) {

        if (!StringUtils.hasText(userIdHeader) || !StringUtils.hasText(role)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID userId = UUID.fromString(userIdHeader);
        ExamDto exam = examService.startExam(examId, userId, tenantId, role);
        return ResponseEntity.ok(exam);
    }

    @PostMapping("/exams/{id}/submit")
    public ResponseEntity<Void> submitExam(@PathVariable("id") UUID examId,
                                           @Valid @RequestBody SubmitExamRequest request,
                                           @RequestHeader("X-User-Id") String userIdHeader,
                                           @RequestHeader("X-User-Role") String role,
                                           @RequestHeader("X-Tenant-Id") String tenantId) {

        if (!StringUtils.hasText(userIdHeader)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // For simplicity, enforce that only students can submit.
        if (!"STUDENT".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        UUID studentId = UUID.fromString(userIdHeader);
        examService.submitExam(examId, studentId, tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}