package com.smartuniversity.booking.web;

import com.smartuniversity.booking.service.BookingService;
import com.smartuniversity.booking.web.dto.CreateReservationRequest;
import com.smartuniversity.booking.web.dto.CreateResourceRequest;
import com.smartuniversity.booking.web.dto.ReservationDto;
import com.smartuniversity.booking.web.dto.ResourceDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST API for resources and reservations.
 */
@RestController
@RequestMapping("/booking")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/resources")
    public List<ResourceDto> listResources(@RequestHeader("X-Tenant-Id") String tenantId) {
        return bookingService.listResources(tenantId);
    }

    @PostMapping("/resources")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceDto createResource(@Valid @RequestBody CreateResourceRequest request,
                                      @RequestHeader("X-Tenant-Id") String tenantId) {
        return bookingService.createResource(request, tenantId);
    }

    @PostMapping("/reservations")
    public ResponseEntity<ReservationDto> createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            @RequestHeader("X-User-Id") String userIdHeader,
            @RequestHeader("X-Tenant-Id") String tenantId) {

        if (!StringUtils.hasText(userIdHeader)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID userId = UUID.fromString(userIdHeader);
        ReservationDto reservation = bookingService.createReservation(request, userId, tenantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(reservation);
    }
}