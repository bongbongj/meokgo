package com.meokgo.server.global.web;

import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class DeviceKeyArgumentResolver implements HandlerMethodArgumentResolver {

    public static final String HEADER_NAME = "X-Device-Key";

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(DeviceKey.class)
                && parameter.getParameterType().equals(String.class);
    }

    @Override
    public Object resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory
    ) {
        String deviceKey = webRequest.getHeader(HEADER_NAME);
        if (!StringUtils.hasText(deviceKey)) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST, HEADER_NAME + " 헤더는 필수입니다.");
        }
        return deviceKey.trim();
    }
}
