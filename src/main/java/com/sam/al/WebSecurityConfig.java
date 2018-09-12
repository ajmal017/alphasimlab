package com.sam.al;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.annotation.web.servlet.configuration.EnableWebMvcSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
@EnableWebMvcSecurity
@EnableGlobalMethodSecurity(securedEnabled = true)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
	
	@Autowired
	private DataSource dataSource;
	
	@Override
    protected void configure(HttpSecurity http) throws Exception {
		http.csrf().disable();
        http.authorizeRequests()
        	.antMatchers("favicon.ico", "/html/**", "/libs/**", "/app/**").permitAll() //Some things to exclude from the filter chain...
	        .antMatchers("/", "/signin", "/signin_fail", "/signout").permitAll()
	        //.anyRequest().authenticated() //Protect everything else
	            .and()
	        // **************** Form configuration ***************** //
	        .formLogin()
	            .loginPage("/signin")
	            .usernameParameter("j_username")
	            .passwordParameter("j_password")
	            .loginProcessingUrl("/j_spring_security_check")
	            .failureUrl("/signin_fail")
	        .and()
				.logout()
				.deleteCookies("JSESSIONID")
				.logoutUrl("/signout")
				.logoutSuccessUrl("/")
				.permitAll()
			.and()
            	.rememberMe();
        //This last line ensures that the application returns status 401 instead of redirecting to a login page
        
    }
	
	@Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
		auth.inMemoryAuthentication()
		.withUser("sam").password("mas").roles("ADMINISTRATOR");
    }
	
//	@Override
//    public void configure(AuthenticationManagerBuilder auth) throws Exception {
//		auth.jdbcAuthentication()
//			.dataSource(dataSource)
//			.usersByUsernameQuery("select email as username, password, true from USER_T where email = ?")
//			.authoritiesByUsernameQuery("select email as username, ROLE from USER_T where email = ?")
//			.passwordEncoder(bCryptPasswordEncoder());
//    }
//	@Bean
//	public BCryptPasswordEncoder bCryptPasswordEncoder(){
//		return new BCryptPasswordEncoder();
//	}
}
