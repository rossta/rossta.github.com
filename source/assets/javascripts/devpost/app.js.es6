const Project = React.createClass({
  descriptionHtml() {
    if (!this.props.description) { return { __html: ""}; }
    return { __html: marked(this.props.description) }
  },

  render() {
    return (
      <div>
        <hr /><br />
        <h2><a href="{this.props.url}">{this.props.name}</a></h2>
        <div><img src={this.props.thumbnailUrl} /></div>
        <div dangerouslySetInnerHTML={this.descriptionHtml()} />
      </div>
     );
  }
});

const Portfolio = React.createClass({
  getInitialState() {
    return { software: [] }
  },

  componentDidMount() {
    const self = this;
    $.get('http://api.devpost.dev/users/rossta/software')
    .pipe(function(data) {
      console.log(data);
      self.setState({ software: data.software });
    });
  },

  render() {
    const software = this.state.software.filter(project => project.name.match(/Lionel/));
    return (
      <div>
        <h1>Projects</h1>
        <p>Check out selected side projects and free open source software of mine, <strong>powered by Devpost</strong>.</p>
        <p><br/></p>
        {
          software.map((project, i) => {
            return <Project
              key={i}
              name={project.name}
              url={project.url}
              thumbnailUrl={project.thumbnail_url}
              tagline={project.tagline}
              description={project.description} />
          })
        }
      </div>
    );
  }
});

React.render(<Portfolio />, document.querySelector('#portfolio'));

  // <h1>Projects</h1>
  //
  // <p>Check out selected side projects and free open source software.</p>
  //
  // <p><br/></p>
  //
  // <hr>
    //
    // <p><br/></p>
    //
    // <h3><a href="https://github.com/rossta/tacokit.rb">Tacokit.rb</a></h3>
    //
    // <p>Ruby toolkit for the <a href="https://developer.trello.com">Trello API</a>&hellip; a work-in-progress. Design and philosophy inspired by <a href="https://gitbhub.com/octokit/octokit.rb">ocktokit.rb</a>. I love using <a href="https://trello.com">Trello</a> almost everyday for work and personal stuff - which means there&rsquo;s a treasure trove of data waiting to be unlocked. The <code>Tacokit</code> gem is a simple ruby interface. It&rsquo;s well-tested and (on its way) to being well-documented and easy to use by Rubyists.</p>
    //
    // <p><code>$ gem install tacokit</code></p>
    //
    // <p><a href="https://github.com/rossta/tacokit">Source code on github</a></p>
    //
    // <p><img alt="Taco" src="http://cl.ly/image/2p1x3K1X160b/taco.png" /></p>
    //
    // <p><br/></p>
    //
    // <hr>
