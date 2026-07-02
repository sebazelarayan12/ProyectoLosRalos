using FluentAssertions;
using LosRalos.Infrastructure.Services;

namespace LosRalos.Tests.Unit.Services;

public class LimitedStreamTests
{
    [Fact]
    public async Task ReadAsync_DentroDelLimite_LeeSinError()
    {
        var data = new byte[100];
        using var inner = new MemoryStream(data);
        using var limited = new LimitedStream(inner, maxBytes: 200);

        using var output = new MemoryStream();
        await limited.CopyToAsync(output);

        output.Length.Should().Be(100);
    }

    [Fact]
    public async Task ReadAsync_SuperaElLimite_LanzaIOException()
    {
        var data = new byte[300];
        using var inner = new MemoryStream(data);
        using var limited = new LimitedStream(inner, maxBytes: 200);

        var act = async () =>
        {
            using var output = new MemoryStream();
            await limited.CopyToAsync(output);
        };

        await act.Should().ThrowAsync<IOException>();
    }

    [Fact]
    public async Task ReadAsync_ExactamenteEnElLimite_LeeSinError()
    {
        var data = new byte[200];
        using var inner = new MemoryStream(data);
        using var limited = new LimitedStream(inner, maxBytes: 200);

        using var output = new MemoryStream();
        await limited.CopyToAsync(output);

        output.Length.Should().Be(200);
    }
}
