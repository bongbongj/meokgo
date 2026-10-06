package com.meokgo.server.api.user;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void 신규_기기_부트스트랩은_최초_실행으로_응답한다() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/bootstrap")
                        .header("X-Device-Key", "device-bootstrap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.first_launch", is(true)))
                .andExpect(jsonPath("$.data.has_active_room", is(false)));
    }

    @Test
    void 닉네임을_최초_설정한다() throws Exception {
        mockMvc.perform(post("/api/v1/users/me/nickname")
                        .header("X-Device-Key", "device-nickname")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"효림\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.nickname", is("효림")))
                .andExpect(jsonPath("$.data.first_launch", is(false)));
    }

    @Test
    void 닉네임을_변경한다() throws Exception {
        mockMvc.perform(post("/api/v1/users/me/nickname")
                        .header("X-Device-Key", "device-change")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"효림\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/v1/users/me/nickname")
                        .header("X-Device-Key", "device-change")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"먹고수\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.nickname", is("먹고수")));
    }
}
