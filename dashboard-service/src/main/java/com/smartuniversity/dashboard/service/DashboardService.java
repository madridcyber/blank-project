package com.smartuniversity.dashboard.service;

import com.smartuniversity.dashboard.domain.SensorReading;
import com.smartuniversity.dashboard.domain.SensorType;
import com.smartuniversity.dashboard.domain.ShuttleLocation;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory simulation of IoT sensor readings and shuttle locations.
 */
@Service
public class DashboardService {

    private final Map<String, List<SensorReading>> sensorsByTenant = new ConcurrentHashMap<>();
    private final Map<String, List<ShuttleLocation>> shuttlesByTenant = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public List<SensorReading> getSensors(String tenantId) {
        return sensorsByTenant.computeIfAbsent(tenantId, this::createDefaultSensors);
    }

    public List<ShuttleLocation> getShuttles(String tenantId) {
        return shuttlesByTenant.computeIfAbsent(tenantId, this::createDefaultShuttles);
    }

    private List<SensorReading> createDefaultSensors(String tenantId) {
        Instant now = Instant.now();
        List<SensorReading> sensors = new ArrayList<>();
        sensors.add(new SensorReading(UUID.randomUUID(), tenantId, SensorType.TEMPERATURE, "Lecture Hall Temp", 22.0, "°C", now));
        sensors.add(new SensorReading(UUID.randomUUID(), tenantId, SensorType.HUMIDITY, "Library Humidity", 45.0, "%", now));
        sensors.add(new SensorReading(UUID.randomUUID(), tenantId, SensorType.CO2, "Lab CO2", 600.0, "ppm", now));
        sensors.add(new SensorReading(UUID.randomUUID(), tenantId, SensorType.ENERGY_USAGE, "Campus Energy", 120.0, "kW", now));
        return sensors;
    }

    private List<ShuttleLocation> createDefaultShuttles(String tenantId) {
        Instant now = Instant.now();
        List<ShuttleLocation> shuttles = new ArrayList<>();
        // Base position roughly in the center of a generic campus
        shuttles.add(new ShuttleLocation(UUID.randomUUID(), tenantId, "Campus Shuttle A", 52.5200, 13.4050, now));
        return shuttles;
    }

    @Scheduled(fixedRateString = "${dashboard.sensors.update-interval-ms:5000}")
    public void updateSensors() {
        Instant now = Instant.now();
        for (List<SensorReading> sensors : sensorsByTenant.values()) {
            for (SensorReading sensor : sensors) {
                double delta = (random.nextDouble() - 0.5) * 2.0; // -1.0 to +1.0
                double newValue = sensor.getValue() + delta;
                // Clamp ranges roughly per type
                switch (sensor.getType()) {
                    case TEMPERATURE -> newValue = clamp(newValue, 18.0, 28.0);
                    case HUMIDITY -> newValue = clamp(newValue, 30.0, 70.0);
                    case CO2 -> newValue = clamp(newValue, 400.0, 1200.0);
                    case ENERGY_USAGE -> newValue = clamp(newValue, 50.0, 300.0);
                    default -> { }
                }
                sensor.setValue(newValue);
                sensor.setUpdatedAt(now);
            }
        }
    }

    @Scheduled(fixedRateString = "${dashboard.shuttle.update-interval-ms:7000}")
    public void updateShuttles() {
        Instant now = Instant.now();
        for (List<ShuttleLocation> shuttles : shuttlesByTenant.values()) {
            for (ShuttleLocation shuttle : shuttles) {
                double dLat = (random.nextDouble() - 0.5) * 0.0005;
                double dLon = (random.nextDouble() - 0.5) * 0.0005;
                shuttle.setLatitude(shuttle.getLatitude() + dLat);
                shuttle.setLongitude(shuttle.getLongitude() + dLon);
                shuttle.setUpdatedAt(now);
            }
        }
    }

    private double clamp(double value, double min, double max) {
        return Math.min(max, Math.max(min, value));
    }
}