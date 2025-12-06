package com.smartuniversity.booking.repository;

import com.smartuniversity.booking.domain.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    List<Resource> findAllByTenantId(String tenantId);

    Optional<Resource> findByIdAndTenantId(UUID id, String tenantId);
}