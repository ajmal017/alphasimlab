
To prevent java from directing smtp connections via IPv6, add the following to the execution line for tomcat: -Djava.net.preferIPv4Stack=true