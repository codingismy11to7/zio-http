package zhttp.internal

import sttp.client3.asynchttpclient.zio.{SttpClient, send}
import sttp.client3.{Response => SResponse, UriContext, asWebSocketUnsafe, basicRequest}
import sttp.model.{Header => SHeader}
import sttp.ws.WebSocket
import zhttp.http.URL.Location
import zhttp.http._
import zhttp.internal.AppCollection.HttpEnv
import zhttp.service._
import zhttp.service.client.ClientSSLHandler.ClientSSLOptions
import zio.test.DefaultRunnableSpec
import zio.{Has, Task, ZIO, ZManaged}

/**
 * Should be used only when e2e tests needs to be written which is typically for logic that is part of the netty based
 * backend. For most of the other use cases directly running the HttpApp should suffice. HttpRunnableSpec spins of an
 * actual Http server and makes requests.
 */
abstract class HttpRunnableSpec(port: Int) extends DefaultRunnableSpec { self =>
  def serve[R <: Has[_]](
    app: HttpApp[R, Throwable],
  ): ZManaged[R with EventLoopGroup with ServerChannelFactory, Nothing, Unit] =
    Server.make(Server.app(app) ++ Server.port(port) ++ Server.paranoidLeakDetection).orDie

  def status(path: Path): ZIO[EventLoopGroup with ChannelFactory, Throwable, Status] =
    Client
      .request(
        Method.GET -> URL(path, Location.Absolute(Scheme.HTTP, "localhost", port)),
        ClientSSLOptions.DefaultSSL,
      )
      .map(_.status)

  def websocketRequest(
    path: Path = !!,
    headers: List[Header] = Nil,
  ): ZIO[SttpClient, Throwable, SResponse[Either[String, WebSocket[Task]]]] = {
    // todo: uri should be created by using URL().asString but currently support for ws Scheme is missing
    val url                       = s"ws://localhost:$port${path.asString}"
    val headerConv: List[SHeader] = headers.map(h => SHeader(h.name.toString(), h.value.toString()))
    send(basicRequest.get(uri"$url").copy(headers = headerConv).response(asWebSocketUnsafe))
  }

  def headers(
    path: Path,
    method: Method,
    content: String,
    headers: (CharSequence, CharSequence)*,
  ): ZIO[EventLoopGroup with ChannelFactory, Throwable, List[Header]] =
    request(path, method, content, headers.map(h => Header.custom(h._1.toString(), h._2)).toList).map(_.headers)

  def request(
    path: Path = !!,
    method: Method = Method.GET,
    content: String = "",
    headers: List[Header] = Nil,
  ): ZIO[EventLoopGroup with ChannelFactory, Throwable, Client.ClientResponse] = {
    val data = HttpData.fromText(content)
    Client.request(
      Client.ClientParams(method -> URL(path, Location.Absolute(Scheme.HTTP, "localhost", port)), headers, data),
      ClientSSLOptions.DefaultSSL,
    )
  }

  implicit class RunnableHttpAppSyntax(app: HttpApp[HttpEnv, Throwable]) {
    def deploy: ZIO[HttpAppCollection, Nothing, String] = AppCollection.deploy(app)

    def websocketStatusCode(
      path: Path = !!,
      headers: List[Header] = Nil,
    ): ZIO[SttpClient with HttpAppCollection, Throwable, Int] = for {
      id  <- deploy
      res <- self.websocketRequest(path, Header(AppCollection.APP_ID, id) :: headers)
    } yield res.code.code
    def request(
      path: Path = !!,
      method: Method = Method.GET,
      content: String = "",
      headers: List[Header] = Nil,
    ): ZIO[EventLoopGroup with ChannelFactory with HttpAppCollection, Throwable, Client.ClientResponse] = for {
      id       <- deploy
      response <- self.request(path, method, content, Header(AppCollection.APP_ID, id) :: headers)
    } yield response

    def requestStatus(
      path: Path = !!,
      method: Method = Method.GET,
      content: String = "",
      headers: List[Header] = Nil,
    ): ZIO[EventLoopGroup with ChannelFactory with HttpAppCollection, Throwable, Status] =
      request(path, method, content, headers).map(_.status)

    def requestBodyAsString(
      path: Path = !!,
      method: Method = Method.GET,
      content: String = "",
      headers: List[Header] = Nil,
    ): ZIO[EventLoopGroup with ChannelFactory with HttpAppCollection, Throwable, String] =
      request(path, method, content, headers).flatMap(_.getBodyAsString)

    def requestHeaderValueByName(
      path: Path = !!,
      method: Method = Method.GET,
      content: String = "",
      headers: List[Header] = Nil,
    )(name: CharSequence): ZIO[EventLoopGroup with ChannelFactory with HttpAppCollection, Throwable, Option[String]] =
      request(path, method, content, headers).map(_.getHeaderValue(name))
  }
}
