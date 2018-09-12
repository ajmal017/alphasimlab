package com.sam.al.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class IngressController {
    @RequestMapping({"/","/landing","/dashboard","/about","/laboratory","/privacy","/contact"})
    public String index(){
    	return "forward:/app/app.html";
    }
}