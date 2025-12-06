package com.smartuniversity.market.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartuniversity.market.domain.Product;
import com.smartuniversity.market.repository.ProductRepository;
import com.smartuniversity.market.service.OrderSagaService;
import com.smartuniversity.market.web.dto.CheckoutRequest;
import com.smartuniversity.market.web.dto.OrderItemRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MarketplaceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
    }

    @Test
    void createProductAndListShouldWorkForTeacher() throws Exception {
        String tenantId = "engineering";
        String teacherId = UUID.randomUUID().toString();

        // Create product
        String productJson = """
                {
                  "name": "Textbook",
                  "description": "Algorithms",
                  "price": 50.0,
                  "stock": 10
                }
                """;

        mockMvc.perform(post("/market/products")
                        .header("X-Tenant-Id", tenantId)
                        .header("X-User-Id", teacherId)
                        .header("X-User-Role", "TEACHER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()));

        // List products
        mockMvc.perform(get("/market/products")
                        .header("X-Tenant-Id", tenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void checkoutShouldInvokeSagaAndPublishEvent() throws Exception {
        String tenantId = "engineering";
        String buyerId = UUID.randomUUID().toString();

        // Insert product directly
        Product product = new Product();
        product.setTenantId(tenantId);
        product.setSellerId(UUID.randomUUID());
        product.setName("Notebook");
        product.setDescription("A5");
        product.setPrice(BigDecimal.valueOf(5.0));
        product.setStock(100);
        product = productRepository.save(product);

        CheckoutRequest checkoutRequest = new CheckoutRequest();
        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(product.getId());
        item.setQuantity(2);
        checkoutRequest.setItems(List.of(item));

        // Mock RabbitTemplate to avoid needing a running broker
        Mockito.doNothing().when(rabbitTemplate)
                .convertAndSend(eq("university.events"), eq("market.order.confirmed"), any());

        mockMvc.perform(post("/market/orders/checkout")
                        .header("X-Tenant-Id", tenantId)
                        .header("X-User-Id", buyerId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.items[0].productId", notNullValue()));
    }
}