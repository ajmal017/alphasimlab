package com.sam.al;

import javax.servlet.MultipartConfigElement;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;


@Configuration
public class WebConfig extends WebMvcConfigurerAdapter {
	
	/**
	 * Expose only src/main/webapp/public directly through the ResourceHttpRequestHandler. Everything else gets protected.
	 * Stuff in this folder will be accessible directly as /projectname/stuff
	 * @author smoblenes
	 *
	 */
	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		//registry.addResourceHandler("/webjars/**").addResourceLocations("classpath:/webjars/");
		registry.addResourceHandler("/**").addResourceLocations("/public/");
	}

	@Bean
	public MultipartConfigElement multipartConfigElement() {
	    return new MultipartConfigElement("");
	}

	
//	@Bean
//    public ViewResolver viewResolver() {
//        InternalResourceViewResolver viewResolver = new InternalResourceViewResolver();
//        viewResolver.setViewClass(JstlView.class);
//        viewResolver.setPrefix("/WEB-INF/jsp/");
//        viewResolver.setSuffix(".jsp");
//        return viewResolver;
//    }
}
