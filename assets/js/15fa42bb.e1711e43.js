"use strict";(self.webpackChunkzio_http_docs=self.webpackChunkzio_http_docs||[]).push([[311],{3905:function(e,t,n){n.d(t,{Zo:function(){return l},kt:function(){return m}});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function c(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var p=r.createContext({}),s=function(e){var t=r.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},l=function(e){var t=s(e.components);return r.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,a=e.originalType,p=e.parentName,l=c(e,["components","mdxType","originalType","parentName"]),d=s(n),m=o,f=d["".concat(p,".").concat(m)]||d[m]||u[m]||a;return n?r.createElement(f,i(i({ref:t},l),{},{components:n})):r.createElement(f,i({ref:t},l))}));function m(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=n.length,i=new Array(a);i[0]=d;var c={};for(var p in t)hasOwnProperty.call(t,p)&&(c[p]=t[p]);c.originalType=e,c.mdxType="string"==typeof e?e:o,i[1]=c;for(var s=2;s<a;s++)i[s]=n[s];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},9903:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return c},contentTitle:function(){return p},metadata:function(){return s},toc:function(){return l},default:function(){return d}});var r=n(7462),o=n(3366),a=(n(7294),n(3905)),i=["components"],c={},p="Authentication",s={unversionedId:"advanced-examples/authentication",id:"advanced-examples/authentication",isDocsHomePage:!1,title:"Authentication",description:"",source:"@site/docs/advanced-examples/authentication.md",sourceDirName:"advanced-examples",slug:"/advanced-examples/authentication",permalink:"/zio-http/docs/advanced-examples/authentication",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Simple Websocket Server",permalink:"/zio-http/docs/zio-http-basic-examples/web-socket"},next:{title:"Concrete Enity",permalink:"/zio-http/docs/advanced-examples/concrete-entity"}},l=[],u={toc:l};function d(e){var t=e.components,n=(0,o.Z)(e,i);return(0,a.kt)("wrapper",(0,r.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"authentication"},"Authentication"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-scala"},'import pdi.jwt.{Jwt, JwtAlgorithm, JwtClaim}\nimport zhttp.http.{Method, _}\nimport zhttp.service.Server\nimport zio._\n\nimport java.time.Clock\n\nobject Authentication extends App {\n  // Secret Authentication key\n  val SECRET_KEY = "secretKey"\n\n  implicit val clock: Clock = Clock.systemUTC\n\n  // Helper to encode the JWT token\n  def jwtEncode(username: String): String = {\n    val json  = s"""{"user": "${username}"}"""\n    val claim = JwtClaim { json }.issuedNow.expiresIn(60)\n    Jwt.encode(claim, SECRET_KEY, JwtAlgorithm.HS512)\n  }\n\n  // Helper to decode the JWT token\n  def jwtDecode(token: String): Option[JwtClaim] = {\n    Jwt.decode(token, SECRET_KEY, Seq(JwtAlgorithm.HS512)).toOption\n  }\n\n  // Authentication middleware\n  // Takes in a Failing HttpApp and a Succeed HttpApp which are \n  // called based on Authentication success or failure\n  // For each request tries to read the `X-ACCESS-TOKEN` header\n  // Validates JWT Claim\n  def authenticate[R, E](fail: HttpApp[R, E], success: JwtClaim => HttpApp[R, E]): HttpApp[R, E] = \n    Http.flatten {\n        Http.fromFunction[Request] {\n        _.getHeader("X-ACCESS-TOKEN")\n            .flatMap(header => jwtDecode(header.value.toString))\n            .fold[HttpApp[R, E]](fail)(success)\n        }\n    }\n\n  // Http app that requires a JWT claim\n  def user(claim: JwtClaim): UHttpApp = Http.collect {\n    case Method.GET -> !! / "user" / name / "greet" => \n        Response.text(s"Welcome to the ZIO party! ${name}")\n    case Method.GET -> !! / "user" / "expiration"   => \n        Response.text(s"Expires in: ${claim.expiration.getOrElse(-1L)}")\n  }\n\n  // App that let\'s the user login\n  // Login is successful only if the password is the reverse of the username\n  def login: UHttpApp = Http.collect { case Method.GET -> !! / "login" / username / password =>\n    if (password.reverse == username) Response.text(jwtEncode(username))\n    else Response.fromHttpError(HttpError.Unauthorized("Invalid username of password\\n"))\n  }\n\n  // Composing all the HttpApps together\n  val app: UHttpApp = login +++ authenticate(Http.forbidden("Not allowed!"), user)\n\n  // Run it like any simple app\n  override def run(args: List[String]): URIO[zio.ZEnv, ExitCode] =\n    Server.start(8090, app).exitCode\n}\n\n')))}d.isMDXComponent=!0}}]);